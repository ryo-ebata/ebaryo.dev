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
const IMPORTS_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const BACKUP_PATH = path.join(IMPORTS_ROOT, 'heptabase-migration-v1-residuals.zip');
const STAGING_ROOT = path.join(IMPORTS_ROOT, '.heptabase-migration-v1-residuals');
const WRITE_FLAG = '--write';
const CARD_LINK = /\[([^\]]+)\]\(\.\.\/Card(?:%20| )Library\/(?:\\.|[^)])*\)/g;
const CARD_WIKILINK = /!?\[\[\.\.\/Card%20Library\/([^\]]+)\]\]/g;

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

const collectMarkdown = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdown(target)));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(target);
  }
  return files;
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const updates = [];
  const dailyRoot = path.join(PRIVATE_ROOT, 'daily');
  for (const filePath of await collectMarkdown(dailyRoot)) {
    const source = await readFile(filePath, 'utf8');
    let content = source
      .replace(CARD_LINK, (_, label) => label.replace(/\.md$/, ''))
      .replace(CARD_WIKILINK, (_, target) => decodeURIComponent(target).replace(/\.md$/, ''));
    if (content.includes('## Heptabase Journal')) {
      content = content.replace(/\.md(?=$| )/gm, '');
    }
    if (content !== source) updates.push({ content, filePath });
  }

  const noteReplacements = new Map([
    ['<form>（React 19）.md', [['[ErrorBoundary.md](./ErrorBoundary.md)', 'ErrorBoundary']]],
    ['Golang.md', [['[コンパイラ言語.md](./コンパイラ言語.md)', 'コンパイラ言語']]],
    ['スタック.md', [['[逆ポーランド記法.md](./逆ポーランド記法.md)', '逆ポーランド記法']]],
    ['借用.md', [['[不変参照(&).md](./不変参照\\(&\\).md)', '不変参照(&)']]],
  ]);
  for (const [name, replacements] of noteReplacements) {
    const filePath = path.join(PRIVATE_ROOT, 'notes', name);
    const source = await readFile(filePath, 'utf8');
    let content = source;
    for (const [before, after] of replacements) content = content.replaceAll(before, after);
    if (content !== source) updates.push({ content, filePath });
  }

  const v8Map = path.join(PRIVATE_ROOT, 'maps', 'V8が行なっていること.md');
  console.log(
    JSON.stringify(
      {
        archiveV8Map: await exists(v8Map),
        dailyFiles: updates.filter(({ filePath }) =>
          filePath.includes(`${path.sep}daily${path.sep}`)
        ).length,
        mode: write ? 'write' : 'dry-run',
        noteFiles: updates.filter(({ filePath }) =>
          filePath.includes(`${path.sep}notes${path.sep}`)
        ).length,
      },
      null,
      2
    )
  );
  if (!write) return;

  for (const { content, filePath } of updates) await writeFile(filePath, content);
  if (await exists(v8Map)) {
    if (await exists(BACKUP_PATH)) throw new Error(`バックアップが既に存在します: ${BACKUP_PATH}`);
    await mkdir(STAGING_ROOT, { recursive: true });
    await rename(v8Map, path.join(STAGING_ROOT, path.basename(v8Map)));
    await run('/usr/bin/zip', ['-Xqr', BACKUP_PATH, path.basename(STAGING_ROOT)], {
      cwd: path.dirname(STAGING_ROOT),
    });
    await run('/usr/bin/unzip', ['-tq', BACKUP_PATH]);
    await rm(STAGING_ROOT, { recursive: true });
  }
  console.log(`[cleanup-heptabase-residuals] ${updates.length}ファイルを修復しました`);
};

main().catch((error) => {
  console.error('[cleanup-heptabase-residuals] 失敗しました:', error.message);
  process.exitCode = 1;
});
