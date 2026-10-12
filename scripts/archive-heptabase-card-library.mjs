#!/usr/bin/env node
import { createHash } from 'node:crypto';
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
const HEPTABASE_ROOT = path.join(PRIVATE_ROOT, 'heptabase');
const SOURCE_ROOT = path.join(HEPTABASE_ROOT, 'Card Library');
const REVIEW_ROOT = path.join(PRIVATE_ROOT, 'inbox', 'heptabase-review');
const ARCHIVE_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'heptabase-card-library-source.zip');
const TEMP_ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'heptabase-card-library-source.tmp.zip');
const ARCHIVED_REVIEW_ROOT = path.join(ARCHIVE_ROOT, 'heptabase-review');
const PROVENANCE_PATH = path.join(ARCHIVED_REVIEW_ROOT, '_source-archive.json');
const WRITE_FLAG = '--write';
const EXPECTED_CARD_COUNT = 820;

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const run = (command, arguments_, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command}が終了コード${code}で失敗しました: ${stderr.trim()}`));
    });
  });

const getMarkdownNames = async (directory) =>
  (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name);

const validateManifestCoverage = async (sourceNames) => {
  const automatic = JSON.parse(
    await readFile(path.join(REVIEW_ROOT, '_automatic-classification.json'), 'utf8')
  );
  const manual = JSON.parse(
    await readFile(path.join(REVIEW_ROOT, '_manual-classification.json'), 'utf8')
  );
  const manifestNames = [...automatic, ...manual].map(({ name }) => name);
  const counts = new Map();
  for (const name of manifestNames) counts.set(name, (counts.get(name) ?? 0) + 1);
  const missing = sourceNames.filter((name) => !counts.has(name));
  const duplicates = [...counts].filter(([, count]) => count !== 1).map(([name]) => name);
  const unknown = manifestNames.filter((name) => !sourceNames.includes(name));
  if (
    manifestNames.length !== EXPECTED_CARD_COUNT ||
    missing.length ||
    duplicates.length ||
    unknown.length
  ) {
    throw new Error(
      `分類マニフェストが原本と一致しません: manifest=${manifestNames.length}, missing=${missing.length}, duplicates=${duplicates.length}, unknown=${unknown.length}`
    );
  }
};

const validateArchive = async (archivePath) => {
  await run('/usr/bin/unzip', ['-tq', archivePath]);
  const entries = await run('/usr/bin/unzip', ['-Z1', archivePath]);
  const markdownCount = entries
    .split('\n')
    .filter((entry) => entry.startsWith('Card Library/') && entry.endsWith('.md')).length;
  if (markdownCount !== EXPECTED_CARD_COUNT) {
    throw new Error(`ZIP内のMarkdown件数が不正です: ${markdownCount}`);
  }
  return markdownCount;
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const [sourceExists, archiveExists, reviewExists, archivedReviewExists] = await Promise.all([
    exists(SOURCE_ROOT),
    exists(ARCHIVE_PATH),
    exists(REVIEW_ROOT),
    exists(ARCHIVED_REVIEW_ROOT),
  ]);

  if (!sourceExists) {
    if (!archiveExists || !archivedReviewExists) {
      throw new Error('原本はありませんが、ZIPまたはレビュー資料も見つかりません');
    }
    const archivedCards = await validateArchive(ARCHIVE_PATH);
    console.log(
      JSON.stringify(
        { archivedCards, mode: write ? 'write' : 'dry-run', status: 'already-archived' },
        null,
        2
      )
    );
    return;
  }
  if (archiveExists) throw new Error(`退避ZIPが既に存在します: ${ARCHIVE_PATH}`);
  if (!reviewExists) throw new Error(`レビュー資料がありません: ${REVIEW_ROOT}`);
  if (archivedReviewExists)
    throw new Error(`レビュー資料の退避先が既に存在します: ${ARCHIVED_REVIEW_ROOT}`);

  const sourceNames = await getMarkdownNames(SOURCE_ROOT);
  if (sourceNames.length !== EXPECTED_CARD_COUNT) {
    throw new Error(`原本件数が不正です: ${sourceNames.length}`);
  }
  await validateManifestCoverage(sourceNames);

  console.log(
    JSON.stringify(
      {
        archive: path.relative(PRIVATE_ROOT, ARCHIVE_PATH),
        cards: sourceNames.length,
        mode: write ? 'write' : 'dry-run',
        reviewArchive: path.relative(PRIVATE_ROOT, ARCHIVED_REVIEW_ROOT),
        source: path.relative(PRIVATE_ROOT, SOURCE_ROOT),
      },
      null,
      2
    )
  );
  if (!write) return;

  await mkdir(ARCHIVE_ROOT, { recursive: true });
  await rm(TEMP_ARCHIVE_PATH, { force: true });
  await run('/usr/bin/zip', ['-Xqr', TEMP_ARCHIVE_PATH, 'Card Library'], {
    cwd: HEPTABASE_ROOT,
  });
  const archivedCards = await validateArchive(TEMP_ARCHIVE_PATH);
  await rename(TEMP_ARCHIVE_PATH, ARCHIVE_PATH);
  await rename(REVIEW_ROOT, ARCHIVED_REVIEW_ROOT);
  const archiveBuffer = await readFile(ARCHIVE_PATH);
  await writeFile(
    PROVENANCE_PATH,
    `${JSON.stringify(
      {
        archive: path.basename(ARCHIVE_PATH),
        cards: archivedCards,
        sha256: createHash('sha256').update(archiveBuffer).digest('hex'),
        source: 'private/heptabase/Card Library',
      },
      null,
      2
    )}\n`
  );
  await rm(SOURCE_ROOT, { recursive: true });
  console.log(
    `[archive-heptabase-card-library] ${archivedCards}件をZIPへ退避し、原本Markdownを削除しました`
  );
};

main().catch((error) => {
  console.error('[archive-heptabase-card-library] 失敗しました:', error.message);
  process.exitCode = 1;
});
