#!/usr/bin/env node
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
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
const REVIEW_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports', 'heptabase-review');
const WRITE_FLAG = '--write';
const DESTINATION_BY_CATEGORY = {
  archive: path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'reviewed'),
  clipping: path.join(PRIVATE_ROOT, 'clipping', 'heptabase'),
  notes: path.join(PRIVATE_ROOT, 'notes'),
  project: path.join(PRIVATE_ROOT, 'archive', 'heptabase', 'projects'),
};
const RELOCATED_DESTINATIONS = new Map([
  ['“use cache“.md'.normalize('NFC'), path.join(PRIVATE_ROOT, 'maps', '“use cache“.md')],
  [
    'V8が行なっていること.md'.normalize('NFC'),
    path.join(PRIVATE_ROOT, 'maps', 'V8が行なっていること.md'),
  ],
]);
const MALFORMED_TERRAFORM_AST_CARD =
  'body = Body(!    [!        Block(!            Block {!                identifier! Identifier(reso.md';

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const collectMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectMarkdownFiles(target);
        return entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
      })
    )
  ).flat();
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
    if (labelStart < 0) continue;
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

const createDestinationMap = async () => {
  const automatic = JSON.parse(
    await readFile(path.join(REVIEW_ROOT, '_automatic-classification.json'), 'utf8')
  );
  const manual = JSON.parse(
    await readFile(path.join(REVIEW_ROOT, '_manual-classification.json'), 'utf8')
  );
  const destinations = new Map();
  for (const entry of automatic) {
    destinations.set(entry.name.normalize('NFC'), path.join(PRIVATE_ROOT, entry.destination));
  }
  for (const entry of manual) {
    const normalizedName = entry.name.normalize('NFC');
    destinations.set(
      normalizedName,
      RELOCATED_DESTINATIONS.get(normalizedName) ??
        path.join(DESTINATION_BY_CATEGORY[entry.category], entry.name)
    );
  }
  const missing = [];
  for (const [name, destination] of destinations) {
    if (await exists(destination)) continue;
    const duplicateMatch = path.basename(destination).match(/^(.*) \d+\.md$/u);
    const canonical = duplicateMatch
      ? path.join(path.dirname(destination), `${duplicateMatch[1]}.md`)
      : null;
    if (canonical && (await exists(canonical))) {
      destinations.set(name, canonical);
      continue;
    }
    missing.push(name);
  }
  if (missing.length) throw new Error(`整理先が存在しないカードがあります: ${missing.join(', ')}`);
  return destinations;
};

const rewriteFile = (content, filePath, destinations) => {
  const links = parseMarkdownLinks(content);
  let rewritten = content;
  let missingAssetsConvertedToText = 0;
  let replacements = 0;
  let unresolved = 0;
  for (const link of links.toReversed()) {
    let decodedDestination;
    try {
      decodedDestination = decodeURIComponent(link.rawDestination.replaceAll('\\', ''));
    } catch {
      continue;
    }
    if (!decodedDestination.includes('Card Library/')) continue;
    const destinationName = path.basename(decodedDestination).normalize('NFC');
    const destination = destinations.get(destinationName);
    if (!destination) {
      if (destinationName.toLowerCase().endsWith('.pdf')) {
        rewritten = `${rewritten.slice(0, link.labelStart)}${link.label}${rewritten.slice(link.destinationEnd + 1)}`;
        missingAssetsConvertedToText += 1;
        continue;
      }
      unresolved += 1;
      continue;
    }
    const relativeTarget = toRelativeTarget(filePath, destination);
    rewritten = `${rewritten.slice(0, link.destinationStart)}${relativeTarget}${rewritten.slice(link.destinationEnd)}`;
    replacements += 1;
  }
  rewritten = rewritten.replace(
    /(!?\[\[)([^\]|#]+)((?:[#|][^\]]*)?\]\])/gu,
    (match, prefix, rawTarget, suffix) => {
      let decodedTarget;
      try {
        decodedTarget = decodeURIComponent(rawTarget.replaceAll('\\', ''));
      } catch {
        return match;
      }
      if (!decodedTarget.includes('Card Library/')) return match;
      const destinationName = path.basename(decodedTarget).normalize('NFC');
      const destination = destinations.get(destinationName);
      if (!destination) {
        unresolved += 1;
        return match;
      }
      replacements += 1;
      return `${prefix}${decodeURIComponent(toRelativeTarget(filePath, destination)).replace(/\.md$/u, '')}${suffix}`;
    }
  );
  const malformedDestination = destinations.get(MALFORMED_TERRAFORM_AST_CARD.normalize('NFC'));
  if (malformedDestination && rewritten.includes('../Card%20Library/body%20=%20Body')) {
    rewritten = rewritten.replace(
      /^.*\(\.\.\/Card%20Library\/body%20=%20Body.*$/mu,
      `[Terraform AST Body](${toRelativeTarget(filePath, malformedDestination)})`
    );
    replacements += 1;
  }
  return { missingAssetsConvertedToText, replacements, rewritten, unresolved };
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const destinations = await createDestinationMap();
  const files = await collectMarkdownFiles(HEPTABASE_ROOT);
  const updates = [];
  let missingAssetsConvertedToText = 0;
  let replacements = 0;
  let unresolved = 0;
  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const result = rewriteFile(content, filePath, destinations);
    missingAssetsConvertedToText += result.missingAssetsConvertedToText;
    replacements += result.replacements;
    unresolved += result.unresolved;
    if (result.rewritten !== content) updates.push({ content: result.rewritten, filePath });
  }
  console.log(
    JSON.stringify(
      {
        files: updates.length,
        missingAssetsConvertedToText,
        mode: write ? 'write' : 'dry-run',
        replacements,
        unresolved,
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[repair-archived-heptabase-links] ${replacements}件の参照を更新しました`);
};

main().catch((error) => {
  console.error('[repair-archived-heptabase-links] 失敗しました:', error.message);
  process.exitCode = 1;
});
