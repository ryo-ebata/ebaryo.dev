#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
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
const PRIVATE_ROOT = path.join(VAULT_ROOT, 'private');
const QUARANTINE_ROOT = path.join(PRIVATE_ROOT, 'quarantine');
const ARCHIVE_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'vault-deduplication-source.zip');
const TEMP_ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'vault-deduplication-source.tmp.zip');
const PROVENANCE_PATH = path.join(ARCHIVE_ROOT, 'vault-deduplication-source.json');
const LEGACY_QUALITY_NOTE = path.join(PRIVATE_ROOT, 'archive', 'ソフトウェア品質戦略入門 (2).md');
const QUALITY_NOTE = path.join(PRIVATE_ROOT, 'clipping', 'ソフトウェア品質戦略入門 (2).md');
const WRITE_FLAG = '--write';

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
    child.on('close', (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${command}が終了コード${code}で失敗しました: ${stderr.trim()}`))
    );
  });

const collectMarkdownFiles = async (directory) =>
  (
    await Promise.all(
      (
        await readdir(directory, { withFileTypes: true })
      ).map(async (entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory() && entry.name !== '.obsidian') return collectMarkdownFiles(target);
        return entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
      })
    )
  ).flat();

const digest = async (filePath) =>
  createHash('sha256')
    .update((await readFile(filePath, 'utf8')).trim())
    .digest('hex');

const findNumberedDuplicates = async (files) => {
  const fileSet = new Set(files.map((file) => file.normalize('NFC')));
  const duplicates = [];
  for (const file of files) {
    if (file.startsWith(`${QUARANTINE_ROOT}${path.sep}`)) continue;
    const match = path.basename(file).match(/^(.*) \d+\.md$/u);
    if (!match) continue;
    const canonical = path.join(path.dirname(file), `${match[1]}.md`);
    if (!fileSet.has(canonical.normalize('NFC'))) continue;
    if ((await digest(file)) === (await digest(canonical)))
      duplicates.push({ canonical, duplicate: file });
  }
  return duplicates;
};

const encodeRelativePath = (relativePath) =>
  relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment).replaceAll('(', '%28').replaceAll(')', '%29'))
    .join('/');

const rewriteLinks = (content, filePath, canonicalByDuplicate) => {
  let rewritten = content;
  for (const [duplicate, canonical] of canonicalByDuplicate) {
    const duplicateName = path.basename(duplicate, '.md');
    const canonicalName = path.basename(canonical, '.md');
    rewritten = rewritten.replaceAll(`[[${duplicateName}]]`, `[[${canonicalName}]]`);
    rewritten = rewritten.replaceAll(`[[${duplicateName}|`, `[[${canonicalName}|`);
  }
  return rewritten.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/gu, (match, prefix, rawTarget, suffix) => {
    if (/^(?:[a-z]+:|#|\/)/iu.test(rawTarget)) return match;
    let decoded;
    try {
      decoded = decodeURIComponent(rawTarget.replaceAll('\\', '')).split('#')[0];
    } catch {
      return match;
    }
    const resolved = path.resolve(path.dirname(filePath), decoded).normalize('NFC');
    const canonical = canonicalByDuplicate.get(resolved);
    if (!canonical) return match;
    let relative = path.relative(path.dirname(filePath), canonical);
    if (!relative.startsWith('.')) relative = `./${relative}`;
    return `${prefix}${encodeRelativePath(relative)}${suffix}`;
  });
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const files = await collectMarkdownFiles(VAULT_ROOT);
  const numberedDuplicates = await findNumberedDuplicates(files);
  const quarantineExists = await exists(QUARANTINE_ROOT);
  const legacyQualityExists = await exists(LEGACY_QUALITY_NOTE);
  const removals = [
    ...numberedDuplicates.map(({ duplicate }) => duplicate),
    ...(legacyQualityExists ? [LEGACY_QUALITY_NOTE] : []),
  ];
  const canonicalByDuplicate = new Map(
    numberedDuplicates.map(({ canonical, duplicate }) => [duplicate.normalize('NFC'), canonical])
  );
  if (legacyQualityExists)
    canonicalByDuplicate.set(LEGACY_QUALITY_NOTE.normalize('NFC'), QUALITY_NOTE);
  const updates = [];
  for (const filePath of files) {
    if (removals.includes(filePath) || filePath.startsWith(`${QUARANTINE_ROOT}${path.sep}`))
      continue;
    const content = await readFile(filePath, 'utf8');
    const rewritten = rewriteLinks(content, filePath, canonicalByDuplicate);
    if (rewritten !== content) updates.push({ content: rewritten, filePath });
  }

  console.log(
    JSON.stringify(
      {
        archive: path.relative(VAULT_ROOT, ARCHIVE_PATH),
        linkUpdates: updates.length,
        mode: write ? 'write' : 'dry-run',
        numberedDuplicates: numberedDuplicates.map(({ canonical, duplicate }) => ({
          canonical: path.relative(VAULT_ROOT, canonical),
          duplicate: path.relative(VAULT_ROOT, duplicate),
        })),
        quarantine: quarantineExists,
        removals: removals.length,
      },
      null,
      2
    )
  );
  if (!write || (!quarantineExists && removals.length === 0)) return;
  if (await exists(ARCHIVE_PATH)) throw new Error(`退避ZIPが既に存在します: ${ARCHIVE_PATH}`);

  await mkdir(ARCHIVE_ROOT, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), 'obsidian-deduplication-'));
  try {
    if (quarantineExists)
      await cp(
        QUARANTINE_ROOT,
        path.join(stagingRoot, path.relative(VAULT_ROOT, QUARANTINE_ROOT)),
        { recursive: true }
      );
    for (const source of removals) {
      const destination = path.join(stagingRoot, path.relative(VAULT_ROOT, source));
      await mkdir(path.dirname(destination), { recursive: true });
      await cp(source, destination);
    }
    await rm(TEMP_ARCHIVE_PATH, { force: true });
    await run('/usr/bin/zip', ['-Xqr', TEMP_ARCHIVE_PATH, '.'], { cwd: stagingRoot });
    await run('/usr/bin/unzip', ['-tq', TEMP_ARCHIVE_PATH]);
    await rename(TEMP_ARCHIVE_PATH, ARCHIVE_PATH);
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  if (quarantineExists) await rm(QUARANTINE_ROOT, { recursive: true });
  await Promise.all(removals.map((filePath) => rm(filePath, { force: true })));
  const archive = await readFile(ARCHIVE_PATH);
  await writeFile(
    PROVENANCE_PATH,
    `${JSON.stringify(
      {
        archive: path.basename(ARCHIVE_PATH),
        linkUpdates: updates.length,
        numberedDuplicates: numberedDuplicates.length,
        removals: removals.length,
        sha256: createHash('sha256').update(archive).digest('hex'),
      },
      null,
      2
    )}\n`
  );
  console.log(
    `[deduplicate-obsidian-vault] ${removals.length}件とQuarantineをZIP退避し、重複を削除しました`
  );
};

main().catch((error) => {
  console.error('[deduplicate-obsidian-vault] 失敗しました:', error.message);
  process.exitCode = 1;
});
