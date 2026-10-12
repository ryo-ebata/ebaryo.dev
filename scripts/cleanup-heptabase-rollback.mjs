#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PRIVATE_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private'
);
const MAPS_ROOT = path.join(PRIVATE_ROOT, 'maps');
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');
const IMPORTS_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const BACKUP_PATH = path.join(IMPORTS_ROOT, 'heptabase-migration-v1-broken-maps.zip');
const STAGING_ROOT = path.join(IMPORTS_ROOT, '.heptabase-migration-v1-broken-maps');
const WRITE_FLAG = '--write';
const WIKI_LINK = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed: ${stderr.trim()}`))
    );
  });

const markdownFiles = async (directory) =>
  (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map(({ name }) => path.join(directory, name));

const buildIndex = async () => {
  const index = new Map();
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const relative = path.relative(PRIVATE_ROOT, target).normalize('NFC');
        index.set(relative, target);
        index.set(`@${path.basename(relative, '.md')}`, target);
      }
    }
  };
  await visit(PRIVATE_ROOT);
  return index;
};

const resolveLink = (index, sourcePath, rawTarget) => {
  if (!rawTarget.includes('/') && !rawTarget.startsWith('.')) {
    return index.has(`@${rawTarget.replace(/\.md$/, '').normalize('NFC')}`);
  }
  const withExtension = rawTarget.endsWith('.md') ? rawTarget : `${rawTarget}.md`;
  const relative = rawTarget.startsWith('private/')
    ? rawTarget.slice('private/'.length)
    : path.relative(PRIVATE_ROOT, path.resolve(path.dirname(sourcePath), withExtension));
  const normalized = (relative.endsWith('.md') ? relative : `${relative}.md`).normalize('NFC');
  return index.has(normalized);
};

const brokenLinks = (index, filePath, source) =>
  [...source.matchAll(WIKI_LINK)]
    .filter(([, target]) => !resolveLink(index, filePath, target))
    .map(([, target]) => target);

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  let index = await buildIndex();
  const orionPath = path.join(MAPS_ROOT, 'Orion.md');
  const orionBefore = await readFile(orionPath, 'utf8');
  const orionAfter = orionBefore.replace(
    '[[private/heptabase/Journal/2026-02-18|BridgeからOrionへの連携調査]]',
    '[[private/daily/2026/02/2026-02-18|BridgeからOrionへの連携調査]]'
  );

  const mapsToArchive = [];
  for (const filePath of await markdownFiles(MAPS_ROOT)) {
    const source = filePath === orionPath ? orionAfter : await readFile(filePath, 'utf8');
    const broken = brokenLinks(index, filePath, source);
    if (broken.length) mapsToArchive.push({ broken, filePath });
  }

  const noteUpdates = [];
  for (const filePath of await markdownFiles(NOTES_ROOT)) {
    const source = await readFile(filePath, 'utf8');
    const broken = new Set(brokenLinks(index, filePath, source));
    if (!broken.size) continue;
    const content = source.replace(WIKI_LINK, (match, target, alias) =>
      broken.has(target) ? alias || path.basename(target) : match
    );
    noteUpdates.push({ broken: [...broken], content, filePath });
  }

  console.log(
    JSON.stringify(
      {
        archivedMaps: mapsToArchive.map(({ broken, filePath }) => ({
          broken,
          file: path.basename(filePath),
        })),
        mode: write ? 'write' : 'dry-run',
        noteUpdates: noteUpdates.map(({ broken, filePath }) => ({
          broken,
          file: path.basename(filePath),
        })),
        orionUpdated: orionAfter !== orionBefore,
      },
      null,
      2
    )
  );
  if (!write) return;

  if (await exists(BACKUP_PATH)) throw new Error(`バックアップが既に存在します: ${BACKUP_PATH}`);
  await writeFile(orionPath, orionAfter);
  for (const { content, filePath } of noteUpdates) await writeFile(filePath, content);
  if (mapsToArchive.length) {
    await mkdir(STAGING_ROOT, { recursive: true });
    for (const { filePath } of mapsToArchive)
      await rename(filePath, path.join(STAGING_ROOT, path.basename(filePath)));
    await run('/usr/bin/zip', ['-Xqr', BACKUP_PATH, path.basename(STAGING_ROOT)], {
      cwd: path.dirname(STAGING_ROOT),
    });
    await run('/usr/bin/unzip', ['-tq', BACKUP_PATH]);
    await rm(STAGING_ROOT, { recursive: true });
  }
  console.log(
    `[cleanup-heptabase-rollback] ${mapsToArchive.length} Mapを隔離し、${noteUpdates.length}ノートを修復しました`
  );
};

main().catch((error) => {
  console.error('[cleanup-heptabase-rollback] 失敗しました:', error.message);
  process.exitCode = 1;
});
