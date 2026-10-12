#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises';
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
const DAILY_ROOT = path.join(PRIVATE_ROOT, 'daily');
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');
const WRITE_FLAG = '--write';
const CREATED_NOTES = {
  アンラーニング: `# アンラーニング

過去に有効だった知識・前提・行動様式を意識的に問い直し、現在の状況に合わないものを手放す学習プロセス。

新しい知識を足すだけでなく、こびりついた思考の癖を認識し、別の見方や行動を選べる状態を作る。
`,
  思考の癖: `# 思考の癖

経験を通じて無意識に繰り返すようになった、物事の捉え方や判断のパターン。

素早い判断を助ける一方、状況が変わっても同じ解釈を続ける原因になる。癖を変えるには、まず反応を観察して言語化する必要がある。
`,
};
const IMAGE_RESTORATIONS = new Map([
  [
    path.join('2026', '08', '2026-08-12.md'),
    {
      marker: '- 14:34  ',
      replacement: '- 14:34 ![[Pasted image 20260812143455.png]] ',
    },
  ],
]);

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(target);
      return entry.isFile() ? [target] : [];
    })
  );
  return nested.flat();
};

const normalize = (value) => value.normalize('NFC').toLowerCase();

const rewriteUnresolvedLinks = (content, existingNames) => {
  let removedEmbeds = 0;
  let replacements = 0;
  const targets = [];
  const rewritten = content.replace(
    /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/gu,
    (match, embed, rawTarget, alias) => {
      const key = normalize(path.basename(rawTarget.trim()).replace(/\.md$/iu, ''));
      if (existingNames.has(key)) return match;
      if (embed) {
        removedEmbeds += 1;
        targets.push(rawTarget.trim());
        return '';
      }
      replacements += 1;
      targets.push(rawTarget.trim());
      return (alias ?? rawTarget).trim();
    }
  );
  return { removedEmbeds, replacements, rewritten, targets };
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const allFiles = await collectFiles(PRIVATE_ROOT);
  const dailyFiles = (await collectFiles(DAILY_ROOT)).filter((filePath) =>
    filePath.endsWith('.md')
  );
  const existingNames = new Set(
    allFiles.flatMap((filePath) => [
      normalize(path.basename(filePath)),
      normalize(path.basename(filePath, path.extname(filePath))),
    ])
  );
  Object.keys(CREATED_NOTES).forEach((name) => existingNames.add(normalize(name)));
  const updates = [];
  let removedEmbeds = 0;
  let replacements = 0;
  let restoredImages = 0;
  const targets = [];
  for (const filePath of dailyFiles) {
    const originalContent = await readFile(filePath, 'utf8');
    let content = originalContent;
    const restoration = IMAGE_RESTORATIONS.get(path.relative(DAILY_ROOT, filePath));
    if (
      restoration &&
      content.includes(restoration.marker) &&
      !content.includes(restoration.replacement)
    ) {
      content = content.replace(restoration.marker, restoration.replacement);
      restoredImages += 1;
    }
    const result = rewriteUnresolvedLinks(content, existingNames);
    removedEmbeds += result.removedEmbeds;
    replacements += result.replacements;
    targets.push(...result.targets);
    if (result.rewritten !== originalContent) updates.push({ content: result.rewritten, filePath });
  }
  const creates = Object.entries(CREATED_NOTES)
    .filter(
      ([name]) =>
        !allFiles.some((filePath) => normalize(path.basename(filePath, '.md')) === normalize(name))
    )
    .map(([name, content]) => ({ content, filePath: path.join(NOTES_ROOT, `${name}.md`) }));
  console.log(
    JSON.stringify(
      {
        creates: creates.map(({ filePath }) => path.basename(filePath)),
        files: updates.length,
        mode: write ? 'write' : 'dry-run',
        removedEmbeds,
        replacements,
        restoredImages,
        targets,
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(
    [...creates, ...updates].map(({ content, filePath }) => writeFile(filePath, content))
  );
  console.log(
    `[finalize-obsidian-daily-candidates] 原子カード${creates.length}件を作成し、単語メモ${replacements + removedEmbeds}件を整理し、画像${restoredImages}件を復元しました`
  );
};

main().catch((error) => {
  console.error('[finalize-obsidian-daily-candidates] 失敗しました:', error.message);
  process.exitCode = 1;
});
