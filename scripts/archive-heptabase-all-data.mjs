#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
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
const SOURCE_PATH = path.join(PRIVATE_ROOT, 'heptabase', 'All-Data.json');
const ARCHIVE_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'heptabase-all-data-source.zip');
const TEMP_ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'heptabase-all-data-source.tmp.zip');
const PROVENANCE_PATH = path.join(ARCHIVE_ROOT, 'heptabase-all-data-source.json');
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
    const stdout = [];
    let stderr = '';
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(stdout));
      else reject(new Error(`${command}が終了コード${code}で失敗しました: ${stderr.trim()}`));
    });
  });

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const validateArchive = async (archivePath, expectedHash) => {
  await run('/usr/bin/unzip', ['-tq', archivePath]);
  const archivedData = await run('/usr/bin/unzip', ['-p', archivePath, 'All-Data.json']);
  const archiveHash = sha256(archivedData);
  if (archiveHash !== expectedHash) throw new Error('ZIP内のAll-Data.jsonが原本と一致しません');
  return archivedData.length;
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const [sourceExists, archiveExists] = await Promise.all([
    exists(SOURCE_PATH),
    exists(ARCHIVE_PATH),
  ]);
  if (!sourceExists) {
    if (!archiveExists || !(await exists(PROVENANCE_PATH))) {
      throw new Error('原本はありませんが、退避ZIPまたは来歴情報も見つかりません');
    }
    console.log(
      JSON.stringify({ mode: write ? 'write' : 'dry-run', status: 'already-archived' }, null, 2)
    );
    return;
  }
  if (archiveExists) throw new Error(`退避ZIPが既に存在します: ${ARCHIVE_PATH}`);
  const source = await readFile(SOURCE_PATH);
  const sourceHash = sha256(source);
  console.log(
    JSON.stringify(
      {
        archive: path.relative(PRIVATE_ROOT, ARCHIVE_PATH),
        bytes: source.length,
        mode: write ? 'write' : 'dry-run',
        source: path.relative(PRIVATE_ROOT, SOURCE_PATH),
      },
      null,
      2
    )
  );
  if (!write) return;
  await rm(TEMP_ARCHIVE_PATH, { force: true });
  await run('/usr/bin/zip', ['-Xq', TEMP_ARCHIVE_PATH, 'All-Data.json'], {
    cwd: path.dirname(SOURCE_PATH),
  });
  const archivedBytes = await validateArchive(TEMP_ARCHIVE_PATH, sourceHash);
  await rename(TEMP_ARCHIVE_PATH, ARCHIVE_PATH);
  await writeFile(
    PROVENANCE_PATH,
    `${JSON.stringify(
      {
        archive: path.basename(ARCHIVE_PATH),
        bytes: archivedBytes,
        sha256: sourceHash,
        source: path.relative(PRIVATE_ROOT, SOURCE_PATH),
      },
      null,
      2
    )}\n`
  );
  await rm(SOURCE_PATH);
  console.log(`[archive-heptabase-all-data] ${archivedBytes} bytesの原本JSONをZIPへ退避しました`);
};

main().catch((error) => {
  console.error('[archive-heptabase-all-data] 失敗しました:', error.message);
  process.exitCode = 1;
});
