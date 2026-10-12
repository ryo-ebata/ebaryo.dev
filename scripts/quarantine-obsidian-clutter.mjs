#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
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
const PRIVATE_ROOT = path.join(VAULT_ROOT, 'private');
const QUARANTINE_ROOT = path.join(PRIVATE_ROOT, 'quarantine', 'import-cleanup');
const WRITE_FLAG = '--write';
const EXCLUDED_DIRECTORIES = new Set(['.obsidian', 'quarantine']);

const collectMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory() && !EXCLUDED_DIRECTORIES.has(entry.name)) {
        return collectMarkdownFiles(entryPath);
      }
      return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [entryPath] : [];
    })
  );
  return nested.flat();
};

const normalizeContent = (content) => content.trim();
const isTrivialContent = (content) => /^(?:#+\s*){0,2}$/.test(normalizeContent(content));
const isPlaceholderName = (filePath) =>
  /^(?:a wonderful new card|untitled|無題のファイル)(?: \d+)?\.md$/i.test(path.basename(filePath));
const contentHash = (content) =>
  createHash('sha256').update(normalizeContent(content)).digest('hex');

const createReferenceNeedles = (filePath) => {
  const basename = path.basename(filePath);
  const stem = path.basename(filePath, path.extname(filePath));
  return [...new Set([basename, stem, encodeURI(basename), encodeURI(stem)])];
};

const hasInboundReference = (record, records) => {
  const needles = createReferenceNeedles(record.filePath);
  return records.some(
    (candidate) =>
      candidate.filePath !== record.filePath &&
      needles.some((needle) => candidate.content.includes(needle))
  );
};

const chooseDuplicateCandidates = (groups) => {
  const duplicateCandidates = new Map();
  for (const records of groups.values()) {
    if (records.length < 2 || isTrivialContent(records[0].content)) continue;
    const sorted = [...records].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath, 'ja')
    );
    const canonical = sorted.find(({ filePath }) => !/ \d+\.md$/i.test(filePath)) ?? sorted[0];
    for (const record of sorted) {
      if (record !== canonical) duplicateCandidates.set(record.filePath, canonical.relativePath);
    }
  }
  return duplicateCandidates;
};

const buildPlan = async () => {
  const files = await collectMarkdownFiles(PRIVATE_ROOT);
  const records = await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, 'utf8');
      return {
        content,
        filePath,
        hash: contentHash(content),
        relativePath: path.relative(PRIVATE_ROOT, filePath),
      };
    })
  );
  const groups = new Map();
  for (const record of records) {
    groups.set(record.hash, [...(groups.get(record.hash) ?? []), record]);
  }
  const duplicateCandidates = chooseDuplicateCandidates(groups);

  return records
    .map((record) => {
      const reasons = [];
      if (normalizeContent(record.content).length === 0) reasons.push('empty');
      else if (isTrivialContent(record.content)) reasons.push('trivial');
      if (isPlaceholderName(record.filePath)) reasons.push('placeholder-name');
      const canonical = duplicateCandidates.get(record.filePath);
      if (canonical) reasons.push(`duplicate-of:${canonical}`);
      if (reasons.length === 0) return null;
      return {
        ...record,
        blockedByReference: hasInboundReference(record, records),
        destinationPath: path.join(QUARANTINE_ROOT, record.relativePath),
        reasons,
      };
    })
    .filter(Boolean);
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const plan = await buildPlan();
  const movable = plan.filter(({ blockedByReference }) => !blockedByReference);
  const blocked = plan.filter(({ blockedByReference }) => blockedByReference);

  console.log(
    JSON.stringify(
      {
        blocked: blocked.map(({ reasons, relativePath }) => ({ path: relativePath, reasons })),
        candidates: plan.length,
        mode: write ? 'write' : 'dry-run',
        movable: movable.map(({ reasons, relativePath }) => ({ path: relativePath, reasons })),
        quarantine: QUARANTINE_ROOT,
      },
      null,
      2
    )
  );

  if (!write) {
    console.log(`[quarantine-obsidian-clutter] 実行するには ${WRITE_FLAG} を付けてください`);
    return;
  }

  for (const item of movable) {
    await mkdir(path.dirname(item.destinationPath), { recursive: true });
    await rename(item.filePath, item.destinationPath);
  }
  await mkdir(QUARANTINE_ROOT, { recursive: true });
  await writeFile(
    path.join(QUARANTINE_ROOT, '_manifest.json'),
    `${JSON.stringify(
      movable.map(({ reasons, relativePath }) => ({ originalPath: relativePath, reasons })),
      null,
      2
    )}\n`
  );
  console.log(`[quarantine-obsidian-clutter] ${movable.length}件を隔離しました`);
};

main().catch((error) => {
  console.error('[quarantine-obsidian-clutter] 失敗しました:', error.message);
  process.exitCode = 1;
});
