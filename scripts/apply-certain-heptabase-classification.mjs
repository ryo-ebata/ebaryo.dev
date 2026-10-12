#!/usr/bin/env node
import { copyFile, mkdir, readFile, readdir, stat, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { classifyHeptabaseCard } from './heptabase-card-classification.mjs';

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
  '_automatic-classification.json'
);
const WRITE_FLAG = '--write';
const DESTINATION_BY_BUCKET = {
  'archive-candidate': path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'fragments'),
  'project-candidate': path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'projects'),
  'source-candidate': path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'source-fragments'),
};

const readOrNull = (filePath) =>
  readFile(filePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

const createPlan = async () => {
  const entries = await readdir(CARD_ROOT, { withFileTypes: true });
  const records = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map(async (entry) => {
        const sourcePath = path.join(CARD_ROOT, entry.name);
        const content = await readFile(sourcePath);
        const classification = classifyHeptabaseCard({
          content: content.toString('utf8'),
          name: entry.name,
        });
        if (classification.confidence !== 'certain') return null;
        const destinationRoot = DESTINATION_BY_BUCKET[classification.bucket];
        if (!destinationRoot) throw new Error(`移動先が未定義です: ${classification.bucket}`);
        const destinationPath = path.join(destinationRoot, entry.name);
        const destination = await readOrNull(destinationPath);
        return {
          ...classification,
          destinationPath,
          name: entry.name,
          source: content,
          sourcePath,
          status:
            destination === null ? 'copy' : content.equals(destination) ? 'unchanged' : 'conflict',
        };
      })
  );
  return records.filter(Boolean);
};

const copyPlannedFile = async ({ destinationPath, sourcePath }) => {
  const sourceStat = await stat(sourcePath);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
  await utimes(destinationPath, sourceStat.atime, sourceStat.mtime);
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const plan = await createPlan();
  const byStatus = Object.groupBy(plan, ({ status }) => status);
  const conflicts = byStatus.conflict ?? [];
  const copies = byStatus.copy ?? [];
  const unchanged = byStatus.unchanged ?? [];
  const byBucket = Object.fromEntries(
    Object.entries(Object.groupBy(plan, ({ bucket }) => bucket)).map(([bucket, records]) => [
      bucket,
      records.length,
    ])
  );

  console.log(
    JSON.stringify(
      {
        byBucket,
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
  if (!write) {
    console.log(
      `[apply-certain-heptabase-classification] 実行するには ${WRITE_FLAG} を付けてください`
    );
    return;
  }

  await Promise.all(copies.map(copyPlannedFile));
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(
      plan.map(({ bucket, destinationPath, name, reason }) => ({
        bucket,
        destination: path.relative(PRIVATE_ROOT, destinationPath),
        name,
        reason,
      })),
      null,
      2
    )}\n`
  );
  console.log(`[apply-certain-heptabase-classification] ${copies.length}件を複製しました`);
};

main().catch((error) => {
  console.error('[apply-certain-heptabase-classification] 失敗しました:', error.message);
  process.exitCode = 1;
});
