#!/usr/bin/env node
import { copyFile, mkdir, readFile, readdir, rename, stat, unlink, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { shouldArchiveLegacyNote } from './obsidian-note-layout.mjs';

const OBSIDIAN_DOCUMENTS_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents'
);
const SOURCE_ROOT = path.join(OBSIDIAN_DOCUMENTS_ROOT, '仕事');
const PRIVATE_ROOT = path.join(OBSIDIAN_DOCUMENTS_ROOT, 'blog', 'private');
const LEGACY_DESTINATION_ROOT = path.join(PRIVATE_ROOT, 'notes');
const ARCHIVE_ROOT = path.join(PRIVATE_ROOT, 'archive');
const DESTINATION_BY_SOURCE = {
  Blog: LEGACY_DESTINATION_ROOT,
  Clippings: path.join(PRIVATE_ROOT, 'clipping'),
  Inbox: LEGACY_DESTINATION_ROOT,
  Kindle: path.join(PRIVATE_ROOT, 'kindle'),
  'Map Of Contents': LEGACY_DESTINATION_ROOT,
};
const SOURCE_DIRECTORIES = Object.keys(DESTINATION_BY_SOURCE);
const WRITE_FLAG = '--write';

const collectMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectMarkdownFiles(entryPath);
      return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [entryPath] : [];
    })
  );
  return files.flat();
};

const getSourceCategory = (filePath) => path.relative(SOURCE_ROOT, filePath).split(path.sep)[0];

const getDestinationRoot = (sourceCategory, basename) =>
  shouldArchiveLegacyNote(sourceCategory, basename)
    ? ARCHIVE_ROOT
    : DESTINATION_BY_SOURCE[sourceCategory];

const createImportPlan = (files) => {
  const filesByName = new Map();
  for (const filePath of files) {
    const basename = path.basename(filePath);
    filesByName.set(basename, [...(filesByName.get(basename) ?? []), filePath]);
  }

  return files.map((sourcePath) => {
    const basename = path.basename(sourcePath);
    const duplicates = filesByName.get(basename) ?? [];
    const sourceCategory = getSourceCategory(sourcePath);
    const keepLegacyCanonicalName = duplicates.length === 1 || sourceCategory === 'Map Of Contents';
    const legacyName = keepLegacyCanonicalName
      ? basename
      : `${path.basename(basename, '.md')} [${sourceCategory}].md`;

    return {
      destinationPath: path.join(getDestinationRoot(sourceCategory, basename), basename),
      legacyPath: path.join(LEGACY_DESTINATION_ROOT, legacyName),
      sourceCategory,
      sourcePath,
    };
  });
};

const readOrNull = (filePath) =>
  readFile(filePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

const classifyPlan = async (plan) => {
  const classified = [];
  for (const item of plan) {
    const [source, destination, legacy] = await Promise.all([
      readFile(item.sourcePath),
      readOrNull(item.destinationPath),
      item.destinationPath === item.legacyPath ? null : readOrNull(item.legacyPath),
    ]);

    let status = 'copy';
    if (destination !== null) {
      status = source.equals(destination)
        ? legacy !== null && source.equals(legacy)
          ? 'cleanup'
          : 'unchanged'
        : 'conflict';
    } else if (legacy !== null && source.equals(legacy)) {
      status = 'relocate';
    }

    classified.push({ ...item, status });
  }
  return classified;
};

const copyPlannedFile = async ({ destinationPath, sourcePath }) => {
  const sourceStat = await stat(sourcePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
  await utimes(destinationPath, sourceStat.atime, sourceStat.mtime);
};

const relocatePlannedFile = async ({ destinationPath, legacyPath }) => {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    await rename(legacyPath, destinationPath);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    await copyFile(legacyPath, destinationPath);
    await unlink(legacyPath);
  }
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const files = (
    await Promise.all(
      SOURCE_DIRECTORIES.map((directory) => collectMarkdownFiles(path.join(SOURCE_ROOT, directory)))
    )
  ).flat();
  const classified = await classifyPlan(createImportPlan(files));
  const byStatus = Object.groupBy(classified, ({ status }) => status);
  const conflicts = byStatus.conflict ?? [];
  const copies = byStatus.copy ?? [];
  const relocations = byStatus.relocate ?? [];
  const cleanups = byStatus.cleanup ?? [];
  const unchanged = byStatus.unchanged ?? [];

  console.log(
    JSON.stringify(
      {
        archive: ARCHIVE_ROOT,
        cleanup: cleanups.length,
        conflicts: conflicts.map(({ destinationPath, sourcePath }) => ({
          destination: destinationPath,
          source: path.relative(SOURCE_ROOT, sourcePath),
        })),
        destinations: DESTINATION_BY_SOURCE,
        mode: write ? 'write' : 'dry-run',
        pendingCopies: copies.length,
        pendingRelocations: relocations.length,
        selectedSources: SOURCE_DIRECTORIES,
        total: classified.length,
        unchanged: unchanged.length,
      },
      null,
      2
    )
  );

  if (conflicts.length > 0) {
    throw new Error('移行先に内容が異なる同名ファイルがあります。上書きせず終了します');
  }
  if (!write) {
    console.log(`[import-legacy-obsidian-notes] 実行するには ${WRITE_FLAG} を付けてください`);
    return;
  }

  await Promise.all(copies.map(copyPlannedFile));
  await Promise.all(relocations.map(relocatePlannedFile));
  await Promise.all(cleanups.map(({ legacyPath }) => unlink(legacyPath)));
  console.log(
    `[import-legacy-obsidian-notes] ${copies.length}件をコピー、${relocations.length}件を移動、${cleanups.length}件の重複を削除しました`
  );
};

main().catch((error) => {
  console.error('[import-legacy-obsidian-notes] 失敗しました:', error.message);
  process.exitCode = 1;
});
