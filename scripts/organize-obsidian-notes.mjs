#!/usr/bin/env node
import { copyFile, mkdir, readFile, rename, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ARCHIVED_NOTE_NAMES } from './obsidian-note-layout.mjs';

const PRIVATE_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private'
);
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');
const ARCHIVE_ROOT = path.join(PRIVATE_ROOT, 'archive');
const WRITE_FLAG = '--write';

const readOrNull = (filePath) =>
  readFile(filePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

const classifyMove = async (name) => {
  const sourcePath = path.join(NOTES_ROOT, name);
  const destinationPath = path.join(ARCHIVE_ROOT, name);
  const [source, destination] = await Promise.all([
    readOrNull(sourcePath),
    readOrNull(destinationPath),
  ]);

  if (source === null) return { destinationPath, name, sourcePath, status: 'unchanged' };
  if (destination === null) return { destinationPath, name, sourcePath, status: 'move' };
  return {
    destinationPath,
    name,
    sourcePath,
    status: source.equals(destination) ? 'cleanup' : 'conflict',
  };
};

const moveFile = async ({ destinationPath, sourcePath }) => {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    await rename(sourcePath, destinationPath);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    await copyFile(sourcePath, destinationPath);
    await unlink(sourcePath);
  }
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const classified = await Promise.all([...ARCHIVED_NOTE_NAMES].map(classifyMove));
  const byStatus = Object.groupBy(classified, ({ status }) => status);
  const conflicts = byStatus.conflict ?? [];
  const moves = byStatus.move ?? [];
  const cleanups = byStatus.cleanup ?? [];

  console.log(
    JSON.stringify(
      {
        archive: ARCHIVE_ROOT,
        cleanup: cleanups.length,
        conflicts: conflicts.map(({ name }) => name),
        mode: write ? 'write' : 'dry-run',
        notes: NOTES_ROOT,
        pendingMoves: moves.length,
        unchanged: (byStatus.unchanged ?? []).length,
      },
      null,
      2
    )
  );

  if (conflicts.length > 0) {
    throw new Error('退避先に内容が異なる同名ファイルがあります。上書きせず終了します');
  }
  if (!write) {
    console.log(`[organize-obsidian-notes] 実行するには ${WRITE_FLAG} を付けてください`);
    return;
  }

  await Promise.all(moves.map(moveFile));
  await Promise.all(cleanups.map(({ sourcePath }) => unlink(sourcePath)));
  console.log(
    `[organize-obsidian-notes] ${moves.length}件を退避、${cleanups.length}件の重複を削除しました`
  );
};

main().catch((error) => {
  console.error('[organize-obsidian-notes] 失敗しました:', error.message);
  process.exitCode = 1;
});
