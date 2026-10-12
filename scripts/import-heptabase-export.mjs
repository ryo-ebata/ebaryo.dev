#!/usr/bin/env node
import { copyFile, mkdir, readFile, readdir, stat, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const EXPORT_PREFIX = 'Heptabase-Data-Backup-';
const DOWNLOADS_ROOT = path.join(os.homedir(), 'Downloads');
const DESTINATION_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'heptabase'
);
const WRITE_FLAG = '--write';

const readOrNull = (filePath) =>
  readFile(filePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

const findLatestExport = async () => {
  const entries = await readdir(DOWNLOADS_ROOT, { withFileTypes: true });
  const exports = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(EXPORT_PREFIX))
    .map((entry) => entry.name)
    .sort();
  const latest = exports.at(-1);
  if (!latest) throw new Error(`${DOWNLOADS_ROOT} にHeptabaseエクスポートがありません`);
  return path.join(DOWNLOADS_ROOT, latest);
};

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(entryPath);
      return entry.isFile() ? [entryPath] : [];
    })
  );
  return nested.flat();
};

const classifyFiles = async (sourceRoot, files) => {
  const classified = [];
  for (const sourcePath of files) {
    const relativePath = path.relative(sourceRoot, sourcePath);
    const destinationPath = path.join(DESTINATION_ROOT, relativePath);
    const [source, destination] = await Promise.all([
      readFile(sourcePath),
      readOrNull(destinationPath),
    ]);
    classified.push({
      destinationPath,
      relativePath,
      sourcePath,
      status: destination === null ? 'copy' : source.equals(destination) ? 'unchanged' : 'conflict',
    });
  }
  return classified;
};

const copyPlannedFile = async ({ destinationPath, sourcePath }) => {
  const sourceStat = await stat(sourcePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
  await utimes(destinationPath, sourceStat.atime, sourceStat.mtime);
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const sourceRoot = await findLatestExport();
  const classified = await classifyFiles(sourceRoot, await collectFiles(sourceRoot));
  const byStatus = Object.groupBy(classified, ({ status }) => status);
  const conflicts = byStatus.conflict ?? [];
  const copies = byStatus.copy ?? [];
  const unchanged = byStatus.unchanged ?? [];

  console.log(
    JSON.stringify(
      {
        conflicts: conflicts.map(({ relativePath }) => relativePath),
        destination: DESTINATION_ROOT,
        mode: write ? 'write' : 'dry-run',
        pendingCopies: copies.length,
        source: sourceRoot,
        total: classified.length,
        unchanged: unchanged.length,
      },
      null,
      2
    )
  );

  if (conflicts.length > 0) {
    throw new Error('移行先に内容が異なるファイルがあります。上書きせず終了します');
  }
  if (!write) {
    console.log(`[import-heptabase-export] 実行するには ${WRITE_FLAG} を付けてください`);
    return;
  }

  await Promise.all(copies.map(copyPlannedFile));
  console.log(`[import-heptabase-export] ${copies.length}件をコピーしました`);
};

main().catch((error) => {
  console.error('[import-heptabase-export] 失敗しました:', error.message);
  process.exitCode = 1;
});
