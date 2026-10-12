#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const VAULT_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog'
);

const collectMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== '.obsidian') return collectMarkdownFiles(entryPath);
      return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [entryPath] : [];
    })
  );
  return nested.flat();
};

const increment = (map, key, value) => map.set(key, [...(map.get(key) ?? []), value]);

const isArchivedPath = (relativePath) =>
  relativePath.split(path.sep).slice(0, 2).join('/') === 'private/archive';

const getSection = (relativePath) => {
  const segments = relativePath.split(path.sep);
  return segments[1] === 'heptabase'
    ? segments.slice(0, 3).join('/')
    : segments.slice(0, 2).join('/');
};

const main = async () => {
  const files = await collectMarkdownFiles(VAULT_ROOT);
  const records = await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, 'utf8');
      const relativePath = path.relative(VAULT_ROOT, filePath);
      return {
        basename: path.basename(filePath).normalize('NFC').toLowerCase(),
        content,
        hash: createHash('sha256').update(content.trim()).digest('hex'),
        relativePath,
        section: getSection(relativePath),
      };
    })
  );

  const byBasename = new Map();
  const byHash = new Map();
  const bySection = new Map();
  for (const record of records) {
    if (!isArchivedPath(record.relativePath)) {
      increment(byBasename, record.basename, record.relativePath);
    }
    increment(byHash, record.hash, record.relativePath);
    bySection.set(record.section, (bySection.get(record.section) ?? 0) + 1);
  }

  const duplicates = (map) =>
    [...map.values()]
      .filter((paths) => paths.length > 1)
      .sort((left, right) => right.length - left.length);

  const emptyFiles = records
    .filter(({ content }) => content.trim().length === 0)
    .map(({ relativePath }) => relativePath);
  const emptyPaths = new Set(emptyFiles);

  console.log(
    JSON.stringify(
      {
        duplicateBasenames: duplicates(byBasename),
        duplicateContents: duplicates(byHash).filter((paths) =>
          paths.some((filePath) => !emptyPaths.has(filePath))
        ),
        emptyFiles,
        sections: Object.fromEntries([...bySection.entries()].sort()),
        totalMarkdownFiles: records.length,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error('[audit-obsidian-vault] 失敗しました:', error.message);
  process.exitCode = 1;
});
