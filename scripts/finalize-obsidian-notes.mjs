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
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');
const WRITE_FLAG = '--write';
const CREATED_NOTES = {
  SoE: `# SoE

System of Engagement。顧客との関係を築き、体験を改善するためのシステム。

迅速な仮説検証とリリースを重視し、Webサービスやモバイルアプリなど顧客が直接利用する接点を担う。
`,
  SoR: `# SoR

System of Record。業務上の事実を正確かつ安定して記録するためのシステム。

信頼性と整合性を重視し、基幹業務や社内業務の正本となるデータを担う。
`,
};

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
  let inFence = false;
  let removedEmbeds = 0;
  let replacements = 0;
  const rewritten = content.split('\n').map((line) => {
    if (/^\s*(```|~~~)/u.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return line.replace(
      /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/gu,
      (match, embed, rawTarget, alias) => {
        const key = normalize(path.basename(rawTarget.trim()).replace(/\.md$/iu, ''));
        if (existingNames.has(key)) return match;
        if (embed) {
          removedEmbeds += 1;
          return '';
        }
        replacements += 1;
        return (alias ?? rawTarget).trim();
      }
    );
  });
  return { removedEmbeds, replacements, rewritten: rewritten.join('\n') };
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const allFiles = await collectFiles(PRIVATE_ROOT);
  const noteFiles = allFiles.filter(
    (filePath) => filePath.startsWith(`${NOTES_ROOT}${path.sep}`) && filePath.endsWith('.md')
  );
  const existingNames = new Set(
    allFiles.map((filePath) => normalize(path.basename(filePath, path.extname(filePath))))
  );
  Object.keys(CREATED_NOTES).forEach((name) => existingNames.add(normalize(name)));
  const updates = [];
  let removedEmbeds = 0;
  let replacements = 0;
  for (const filePath of noteFiles) {
    const content = await readFile(filePath, 'utf8');
    const result = rewriteUnresolvedLinks(content, existingNames);
    removedEmbeds += result.removedEmbeds;
    replacements += result.replacements;
    if (result.rewritten !== content) updates.push({ content: result.rewritten, filePath });
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
    `[finalize-obsidian-notes] 原子カード${creates.length}件を作成し、未解決参照${replacements + removedEmbeds}件を整理しました`
  );
};

main().catch((error) => {
  console.error('[finalize-obsidian-notes] 失敗しました:', error.message);
  process.exitCode = 1;
});
