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
const CONTENT_ROOTS = ['clipping', 'daily', 'inbox', 'kindle', 'maps', 'notes'].map((directory) =>
  path.join(PRIVATE_ROOT, directory)
);
const WRITE_FLAG = '--write';

const collectMarkdown = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdown(target)));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(target);
  }
  return files;
};

const visibleHeading = (heading) =>
  heading.trim().replaceAll('**', '').replaceAll('`', '').trim().normalize('NFC');

const removeDuplicateTitle = (content, title) => {
  const lines = content.split('\n');
  let index = 0;
  if (lines[0] === '---') {
    index = 1;
    while (index < lines.length && lines[index] !== '---') index += 1;
    if (index < lines.length) index += 1;
  }

  let fenced = false;
  const duplicateIndexes = [];
  for (; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = lines[index].match(/^#\s+(.+?)\s*$/);
    if (!match) continue;
    if (visibleHeading(match[1]) === title) duplicateIndexes.push(index);
  }
  if (duplicateIndexes.length === 0) return null;
  for (const duplicateIndex of duplicateIndexes.reverse()) {
    lines.splice(duplicateIndex, lines[duplicateIndex + 1] === '' ? 2 : 1);
  }
  return lines.join('\n');
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const files = (await Promise.all(CONTENT_ROOTS.map(collectMarkdown))).flat();
  const updates = [];
  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const title = path.basename(filePath, '.md').normalize('NFC').replaceAll('!form!', '<form>');
    const normalizedContent = removeDuplicateTitle(content, title);
    if (normalizedContent !== null) updates.push({ content: normalizedContent, filePath });
  }

  console.log(
    JSON.stringify(
      {
        files: updates.length,
        mode: write ? 'write' : 'dry-run',
        samples: updates.slice(0, 30).map(({ filePath }) => path.relative(PRIVATE_ROOT, filePath)),
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[normalize-obsidian-note-headings] 重複H1を${updates.length}件削除しました`);
};

main().catch((error) => {
  console.error('[normalize-obsidian-note-headings] 失敗しました:', error.message);
  process.exitCode = 1;
});
