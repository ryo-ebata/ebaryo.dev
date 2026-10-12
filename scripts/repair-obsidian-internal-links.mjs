#!/usr/bin/env node
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
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
const WRITE_FLAG = '--write';
const OBSOLETE_TUTORIAL_LINKS = new Set([
  '../Whiteboard/Another whiteboard.md',
  '../Whiteboard/Getting Started.md',
]);
const OBSOLETE_TUTORIAL_SOURCE =
  'private/archive/heptabase/fragments/Cards can mention each other..md';

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const collectMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== '.obsidian') return collectMarkdownFiles(target);
      return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [target] : [];
    })
  );
  return nested.flat();
};

const encodeRelativePath = (relativePath) =>
  relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment).replaceAll('(', '%28').replaceAll(')', '%29'))
    .join('/');

const toRelativeTarget = (fromFile, destination) => {
  let relativePath = path.relative(path.dirname(fromFile), destination);
  if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;
  return encodeRelativePath(relativePath);
};

const parseMarkdownLinks = (content) => {
  const links = [];
  for (let cursor = 0; cursor < content.length; cursor += 1) {
    if (content[cursor] !== ']' || content[cursor + 1] !== '(') continue;
    const labelStart = content.lastIndexOf('[', cursor);
    if (labelStart < 0 || content[labelStart - 1] === '!') continue;
    let destinationEnd = cursor + 2;
    let depth = 1;
    let escaped = false;
    for (; destinationEnd < content.length; destinationEnd += 1) {
      const character = content[destinationEnd];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\') {
        escaped = true;
        continue;
      }
      if (character === '(') depth += 1;
      if (character === ')') depth -= 1;
      if (depth === 0) break;
    }
    if (depth !== 0) continue;
    links.push({
      destinationEnd,
      destinationStart: cursor + 2,
      label: content.slice(labelStart + 1, cursor),
      labelStart,
      rawDestination: content.slice(cursor + 2, destinationEnd),
    });
    cursor = destinationEnd;
  }
  return links;
};

const decodeDestination = (rawDestination) => {
  const unwrapped =
    rawDestination.startsWith('<') && rawDestination.endsWith('>')
      ? rawDestination.slice(1, -1)
      : rawDestination;
  try {
    return decodeURIComponent(unwrapped.replaceAll('\\', ''));
  } catch {
    return null;
  }
};

const getMarkdownTarget = (rawDestination) => {
  const decoded = decodeDestination(rawDestination);
  if (!decoded || /^[a-z][a-z\d+.-]*:/iu.test(decoded) || decoded.startsWith('//')) return null;
  const [fileTarget, fragment = ''] = decoded.split('#', 2);
  if (!fileTarget.toLowerCase().endsWith('.md')) return null;
  return { fileTarget, fragment };
};

const createBasenameIndex = (files) => {
  const index = new Map();
  for (const filePath of files) {
    const basename = path.basename(filePath).normalize('NFC').toLowerCase();
    index.set(basename, [...(index.get(basename) ?? []), filePath]);
  }
  return index;
};

const rewritePathWikiLinks = (content, filePath, basenameIndex, knownFiles) => {
  let replacements = 0;
  const replacementTargets = [];
  const rewritten = content.replace(
    /(!?\[\[)([^\]|#]+)((?:#[^\]|]*)?(?:\|[^\]]*)?\]\])/gu,
    (match, prefix, rawTarget, suffix) => {
      const target = rawTarget.trim();
      if (!target.startsWith('./') && !target.startsWith('../')) return match;
      const currentTarget = path.resolve(path.dirname(filePath), target);
      if (knownFiles.has(currentTarget) || knownFiles.has(`${currentTarget}.md`)) return match;
      const extension = path.extname(target);
      const basename = path.basename(target, extension).normalize('NFC').toLowerCase();
      const candidates = basenameIndex.get(`${basename}.md`) ?? [];
      if (candidates.length !== 1) return match;
      let relativeTarget = path.relative(path.dirname(filePath), candidates[0]);
      if (!relativeTarget.startsWith('.')) relativeTarget = `./${relativeTarget}`;
      replacements += 1;
      replacementTargets.push({
        from: target,
        to: relativeTarget.replace(/\.md$/u, ''),
      });
      return `${prefix}${relativeTarget.replace(/\.md$/u, '')}${suffix}`;
    }
  );
  return { replacementTargets, replacements, rewritten };
};

const rewriteFile = async (content, filePath, basenameIndex, knownFiles) => {
  let rewritten = content;
  let obsoleteLinksRemoved = 0;
  let replacements = 0;
  const unresolved = [];
  for (const link of parseMarkdownLinks(content).toReversed()) {
    const target = getMarkdownTarget(link.rawDestination);
    if (!target) continue;
    const currentDestination = target.fileTarget.startsWith('/')
      ? path.join(VAULT_ROOT, target.fileTarget)
      : path.resolve(path.dirname(filePath), target.fileTarget);
    if (await exists(currentDestination)) continue;
    const basename = path.basename(target.fileTarget).normalize('NFC').toLowerCase();
    let candidates = basenameIndex.get(basename) ?? [];
    const duplicateMatch = basename.match(/^(.*) \d+(\.md)$/u);
    if (candidates.length === 0 && duplicateMatch) {
      candidates = basenameIndex.get(`${duplicateMatch[1]}${duplicateMatch[2]}`) ?? [];
    }
    if (candidates.length !== 1) {
      const relativeSource = path.relative(VAULT_ROOT, filePath);
      if (
        relativeSource === OBSOLETE_TUTORIAL_SOURCE &&
        OBSOLETE_TUTORIAL_LINKS.has(target.fileTarget)
      ) {
        rewritten = `${rewritten.slice(0, link.labelStart)}${link.label}${rewritten.slice(link.destinationEnd + 1)}`;
        obsoleteLinksRemoved += 1;
        continue;
      }
      unresolved.push({ candidates: candidates.length, target: target.fileTarget });
      continue;
    }
    const fragment = target.fragment ? `#${encodeURIComponent(target.fragment)}` : '';
    const replacement = `${toRelativeTarget(filePath, candidates[0])}${fragment}`;
    rewritten = `${rewritten.slice(0, link.destinationStart)}${replacement}${rewritten.slice(link.destinationEnd)}`;
    replacements += 1;
  }
  const wikiResult = rewritePathWikiLinks(rewritten, filePath, basenameIndex, knownFiles);
  return {
    obsoleteLinksRemoved,
    replacements,
    rewritten: wikiResult.rewritten,
    unresolved,
    wikiReplacementTargets: wikiResult.replacementTargets,
    wikiReplacements: wikiResult.replacements,
  };
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const files = await collectMarkdownFiles(VAULT_ROOT);
  const basenameIndex = createBasenameIndex(files);
  const knownFiles = new Set(files);
  const updates = [];
  const unresolved = [];
  let obsoleteLinksRemoved = 0;
  let replacements = 0;
  let wikiReplacements = 0;
  const wikiReplacementTargets = [];
  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const result = await rewriteFile(content, filePath, basenameIndex, knownFiles);
    obsoleteLinksRemoved += result.obsoleteLinksRemoved;
    replacements += result.replacements;
    wikiReplacements += result.wikiReplacements;
    wikiReplacementTargets.push(
      ...result.wikiReplacementTargets.map((entry) => ({
        ...entry,
        file: path.relative(VAULT_ROOT, filePath),
      }))
    );
    unresolved.push(
      ...result.unresolved.map((entry) => ({
        ...entry,
        file: path.relative(VAULT_ROOT, filePath),
      }))
    );
    if (result.rewritten !== content) updates.push({ content: result.rewritten, filePath });
  }
  console.log(
    JSON.stringify(
      {
        files: updates.length,
        mode: write ? 'write' : 'dry-run',
        obsoleteLinksRemoved,
        replacements,
        unresolved: unresolved.length,
        unresolvedReferences: unresolved,
        unresolvedTargets: [...new Set(unresolved.map(({ target }) => target))].sort(),
        wikiReplacements,
        wikiReplacementTargets,
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(
    `[repair-obsidian-internal-links] ${replacements + wikiReplacements}件の参照を更新しました`
  );
};

main().catch((error) => {
  console.error('[repair-obsidian-internal-links] 失敗しました:', error.message);
  process.exitCode = 1;
});
