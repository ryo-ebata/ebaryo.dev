#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
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
const REVIEW_ROOT = path.join(IMPORTS_ROOT, 'heptabase-review');
const BACKUP_PATH = path.join(IMPORTS_ROOT, 'heptabase-migration-v1-derived.zip');
const STAGING_ROOT = path.join(IMPORTS_ROOT, '.heptabase-migration-v1-derived');
const WRITE_FLAG = '--write';

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

const readJson = async (name) => JSON.parse(await readFile(path.join(REVIEW_ROOT, name), 'utf8'));

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  if (await exists(BACKUP_PATH)) throw new Error(`バックアップが既に存在します: ${BACKUP_PATH}`);

  const manual = await readJson('_manual-classification.json');
  const noteFiles = manual
    .filter(({ category }) => category === 'notes')
    .map(({ name }) => path.join(PRIVATE_ROOT, 'notes', name));
  const roots = [
    path.join(PRIVATE_ROOT, 'heptabase'),
    path.join(PRIVATE_ROOT, 'clipping', 'heptabase'),
    path.join(PRIVATE_ROOT, 'archive', 'heptabase'),
  ];
  const targets = [];
  for (const target of [...roots, ...noteFiles]) {
    if (await exists(target)) targets.push(target);
  }

  console.log(
    JSON.stringify(
      {
        backup: path.relative(PRIVATE_ROOT, BACKUP_PATH),
        mode: write ? 'write' : 'dry-run',
        noteCopies: targets.filter((target) => target.includes(`${path.sep}notes${path.sep}`))
          .length,
        roots: roots
          .filter((root) => targets.includes(root))
          .map((root) => path.relative(PRIVATE_ROOT, root)),
        targets: targets.length,
      },
      null,
      2
    )
  );
  if (!write) return;

  await mkdir(STAGING_ROOT, { recursive: true });
  for (const target of targets) {
    const relative = path.relative(PRIVATE_ROOT, target);
    const destination = path.join(STAGING_ROOT, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await rename(target, destination);
  }
  await run('/usr/bin/zip', ['-Xqr', BACKUP_PATH, path.basename(STAGING_ROOT)], {
    cwd: path.dirname(STAGING_ROOT),
  });
  await run('/usr/bin/unzip', ['-tq', BACKUP_PATH]);
  await rm(STAGING_ROOT, { recursive: true });
  console.log(`[rollback-heptabase-migration] ${targets.length}対象を退避しました`);
};

main().catch((error) => {
  console.error('[rollback-heptabase-migration] 失敗しました:', error.message);
  process.exitCode = 1;
});
