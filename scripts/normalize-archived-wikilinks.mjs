#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises';
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
const TARGET_ROOTS = [
  path.join(VAULT_ROOT, 'private', 'archive'),
  path.join(VAULT_ROOT, 'private', 'clipping'),
];
const WRITE_FLAG = '--write';

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

const normalizePath = (target) => target.normalize('NFC').toLowerCase();

const createFileIndex = (files) => {
  const absolute = new Set(files.map(normalizePath));
  const byName = new Map();
  for (const filePath of files) {
    const names = [path.basename(filePath), path.basename(filePath, path.extname(filePath))];
    for (const name of names) {
      const key = normalizePath(name);
      byName.set(key, [...(byName.get(key) ?? []), filePath]);
    }
  }
  return { absolute, byName };
};

const targetExists = (rawTarget, sourcePath, index) => {
  const target = rawTarget.trim();
  if (!target) return false;
  if (target.includes('/')) {
    const base = target.startsWith('.')
      ? path.resolve(path.dirname(sourcePath), target)
      : path.join(VAULT_ROOT, target);
    const candidates = path.extname(base) ? [base] : [base, `${base}.md`];
    return candidates.some((candidate) => index.absolute.has(normalizePath(candidate)));
  }
  const key = normalizePath(target.replace(/\.md$/iu, ''));
  return (index.byName.get(key) ?? []).length === 1;
};

const rewriteContent = (content, sourcePath, index) => {
  let inFence = false;
  let replacements = 0;
  const targets = [];
  const lines = content.split('\n');
  const rewritten = lines.map((line) => {
    if (/^\s*(```|~~~)/u.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return line.replace(
      /!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/gu,
      (match, rawTarget, alias) => {
        if (targetExists(rawTarget, sourcePath, index)) return match;
        replacements += 1;
        targets.push(rawTarget.trim());
        return (alias ?? rawTarget).trim();
      }
    );
  });
  return { replacements, rewritten: rewritten.join('\n'), targets };
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const allFiles = await collectFiles(VAULT_ROOT);
  const targetFiles = (await Promise.all(TARGET_ROOTS.map((directory) => collectFiles(directory))))
    .flat()
    .filter((filePath) => filePath.toLowerCase().endsWith('.md'));
  const index = createFileIndex(allFiles);
  const updates = [];
  const countsBySection = {};
  const samples = [];
  const targets = new Set();
  let replacements = 0;
  for (const filePath of targetFiles) {
    const content = await readFile(filePath, 'utf8');
    const result = rewriteContent(content, filePath, index);
    if (!result.replacements) continue;
    replacements += result.replacements;
    result.targets.forEach((target) => targets.add(target));
    for (const target of result.targets) {
      if (samples.length >= 20) break;
      samples.push({ file: path.relative(VAULT_ROOT, filePath), target });
    }
    const section = path.relative(VAULT_ROOT, filePath).split(path.sep).slice(0, 2).join('/');
    countsBySection[section] = (countsBySection[section] ?? 0) + result.replacements;
    updates.push({ content: result.rewritten, filePath });
  }
  console.log(
    JSON.stringify(
      {
        countsBySection,
        files: updates.length,
        mode: write ? 'write' : 'dry-run',
        replacements,
        samples,
        uniqueTargets: targets.size,
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[normalize-archived-wikilinks] ${replacements}件を通常テキストへ戻しました`);
};

main().catch((error) => {
  console.error('[normalize-archived-wikilinks] 失敗しました:', error.message);
  process.exitCode = 1;
});
