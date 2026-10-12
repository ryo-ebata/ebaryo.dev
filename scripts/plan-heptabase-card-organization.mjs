#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { classifyHeptabaseCard } from './heptabase-card-classification.mjs';

const CARD_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'heptabase',
  'Card Library'
);
const PRIVATE_ROOT = path.dirname(path.dirname(CARD_ROOT));
const REVIEW_ROOT = path.join(PRIVATE_ROOT, 'inbox', 'heptabase-review');
const AUTOMATIC_MANIFEST_PATH = path.join(REVIEW_ROOT, '_automatic-classification.json');
const MANUAL_MANIFEST_PATH = path.join(REVIEW_ROOT, '_manual-classification.json');
const EXAMPLE_LIMIT = 15;
const WRITE_FLAG = '--write';
const BUCKET_LABELS = {
  'archive-candidate': '保管・除外候補',
  'atomic-candidate': '原子メモ候補',
  'inbox-candidate': '要判断',
  'project-candidate': '業務・プロジェクト候補',
  'source-candidate': '外部資料・章断片候補',
};
const readOrEmpty = (filePath) => readFile(filePath, 'utf8').catch(() => '');

const readJsonOr = async (filePath, fallback) =>
  readFile(filePath, 'utf8')
    .then(JSON.parse)
    .catch((error) => {
      if (error.code === 'ENOENT') return fallback;
      throw error;
    });

const checkedTargets = (content) =>
  new Set([...content.matchAll(/^- \[x\] \[[^\]]+\]\(([^)]+)\)/gimu)].map((match) => match[1]));

const encodePathSegment = (segment) =>
  encodeURIComponent(segment).replace(
    /[!'()*]/gu,
    (character) => `%${character.codePointAt(0).toString(16).toUpperCase()}`
  );

const encodePath = (relativePath) => relativePath.split(path.sep).map(encodePathSegment).join('/');

const escapeLinkLabel = (label) => label.replaceAll('[', '\\[').replaceAll(']', '\\]');

const writeReviewPage = async (bucket, records) => {
  const label = BUCKET_LABELS[bucket];
  const outputPath = path.join(REVIEW_ROOT, `${label}.md`);
  const previousChecks = checkedTargets(await readOrEmpty(outputPath));
  const rows = records
    .sort((left, right) => left.name.localeCompare(right.name, 'ja'))
    .map(({ name, reason }) => {
      const target = encodePath(path.join('..', '..', 'heptabase', 'Card Library', name));
      const checked = previousChecks.has(target) ? 'x' : ' ';
      return `- [${checked}] [${escapeLinkLabel(name)}](${target}) — ${reason}`;
    });
  const content = [
    '---',
    'generated: true',
    `heptabase_bucket: ${bucket}`,
    '---',
    '',
    `# ${label}`,
    '',
    `${records.length}件。チェックは確認済みを表す。再生成しても状態を保持する。`,
    '',
    ...rows,
    '',
  ].join('\n');
  await writeFile(outputPath, content);
};

const writeReviewIndex = async (buckets, completed) => {
  await mkdir(REVIEW_ROOT, { recursive: true });
  await Promise.all(
    Object.keys(BUCKET_LABELS).map((bucket) => writeReviewPage(bucket, buckets[bucket] ?? []))
  );
  const rows = Object.entries(BUCKET_LABELS).map(
    ([bucket, label]) => `- [[${label}]]: ${buckets[bucket]?.length ?? 0}件`
  );
  await writeFile(
    path.join(REVIEW_ROOT, 'README.md'),
    [
      '# Heptabase整理レビュー',
      '',
      'Card Libraryを移動する前の確認用インデックス。元ファイルは変更しない。',
      '',
      `分類済み: ${completed}件 / 未分類: ${Object.values(buckets).flat().length}件`,
      '',
      '## 見方',
      '',
      '- リンクを開いて内容を確認する',
      '- 分類が正しければチェックする',
      '- 誤分類はチェックせず、後続の整理対象にする',
      '',
      '## 候補',
      '',
      ...rows,
      '',
    ].join('\n')
  );
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const entries = await readdir(CARD_ROOT, { withFileTypes: true });
  const records = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map(async (entry) => {
        const filePath = path.join(CARD_ROOT, entry.name);
        const content = await readFile(filePath, 'utf8');
        return {
          content,
          name: entry.name,
          ...classifyHeptabaseCard({ content, name: entry.name }),
        };
      })
  );
  const buckets = Object.groupBy(records, ({ bucket }) => bucket);
  const [automatic, manual] = await Promise.all([
    readJsonOr(AUTOMATIC_MANIFEST_PATH, []),
    readJsonOr(MANUAL_MANIFEST_PATH, []),
  ]);
  const completedNames = new Set([...automatic, ...manual].map(({ name }) => name));
  const pendingRecords = records.filter(
    ({ confidence, name }) => confidence === 'review' && !completedNames.has(name)
  );
  const pendingBuckets = Object.groupBy(pendingRecords, ({ bucket }) => bucket);
  const summary = Object.fromEntries(
    Object.entries(buckets)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([bucket, items]) => [
        bucket,
        {
          count: items.length,
          examples: items
            .sort((left, right) => left.name.localeCompare(right.name, 'ja'))
            .slice(0, EXAMPLE_LIMIT)
            .map(({ name, reason }) => ({ name, reason })),
        },
      ])
  );

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        review: REVIEW_ROOT,
        source: CARD_ROOT,
        summary,
        total: records.length,
      },
      null,
      2
    )
  );
  if (!write) {
    console.log(`[plan-heptabase-card-organization] 生成するには ${WRITE_FLAG} を付けてください`);
    return;
  }
  await writeReviewIndex(pendingBuckets, completedNames.size);
  console.log(`[plan-heptabase-card-organization] レビュー用インデックスを生成しました`);
};

main().catch((error) => {
  console.error('[plan-heptabase-card-organization] 失敗しました:', error.message);
  process.exitCode = 1;
});
