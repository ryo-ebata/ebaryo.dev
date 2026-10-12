#!/usr/bin/env node
import { copyFile, mkdir, readFile, stat, utimes, writeFile } from 'node:fs/promises';
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
const CARD_ROOT = path.join(PRIVATE_ROOT, 'heptabase', 'Card Library');
const MANIFEST_PATH = path.join(
  PRIVATE_ROOT,
  'inbox',
  'heptabase-review',
  '_manual-classification.json'
);
const DESTINATION_BY_CATEGORY = {
  archive: path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'reviewed'),
  clipping: path.join(PRIVATE_ROOT, 'clipping', 'heptabase'),
  notes: path.join(PRIVATE_ROOT, 'notes'),
  project: path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'projects'),
};
const WRITE_FLAG = '--write';

const getArgument = (name) => {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
};

const readJsonOr = async (filePath, fallback) =>
  readFile(filePath, 'utf8')
    .then(JSON.parse)
    .catch((error) => {
      if (error.code === 'ENOENT') return fallback;
      throw error;
    });

const createPlan = async (decisions) => {
  const plan = [];
  for (const decision of decisions) {
    const destinationRoot = DESTINATION_BY_CATEGORY[decision.category];
    if (!destinationRoot) throw new Error(`未対応の分類です: ${decision.category}`);
    const sourcePath = path.join(CARD_ROOT, decision.name);
    const destinationPath = path.join(destinationRoot, decision.name);
    const source = await readFile(sourcePath);
    const destination = await readFile(destinationPath).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    plan.push({
      ...decision,
      destinationPath,
      sourcePath,
      status: destination === null ? 'copy' : source.equals(destination) ? 'unchanged' : 'conflict',
    });
  }
  return plan;
};

const copyPlannedFile = async ({ destinationPath, sourcePath }) => {
  const sourceStat = await stat(sourcePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
  await utimes(destinationPath, sourceStat.atime, sourceStat.mtime);
};

const main = async () => {
  const decisionsPath = getArgument('decisions');
  if (!decisionsPath) throw new Error('--decisions=/path/to/decisions.json が必要です');
  const write = process.argv.includes(WRITE_FLAG);
  const decisions = await readJsonOr(path.resolve(decisionsPath), []);
  const plan = await createPlan(decisions);
  const conflicts = plan.filter(({ status }) => status === 'conflict');
  const copies = plan.filter(({ status }) => status === 'copy');
  const unchanged = plan.filter(({ status }) => status === 'unchanged');

  console.log(
    JSON.stringify(
      {
        conflicts: conflicts.map(({ name }) => name),
        mode: write ? 'write' : 'dry-run',
        pendingCopies: copies.length,
        total: plan.length,
        unchanged: unchanged.length,
      },
      null,
      2
    )
  );
  if (conflicts.length > 0) throw new Error('整理先に内容が異なる同名ファイルがあります');
  if (!write) return;

  await Promise.all(copies.map(copyPlannedFile));
  const previous = await readJsonOr(MANIFEST_PATH, []);
  const merged = new Map(previous.map((decision) => [decision.name, decision]));
  for (const { category, name, reason } of decisions) merged.set(name, { category, name, reason });
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, `${JSON.stringify([...merged.values()], null, 2)}\n`);
  console.log(`[apply-reviewed-heptabase-cards] ${copies.length}件を複製しました`);
};

main().catch((error) => {
  console.error('[apply-reviewed-heptabase-cards] 失敗しました:', error.message);
  process.exitCode = 1;
});
