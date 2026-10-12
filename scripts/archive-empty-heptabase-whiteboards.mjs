#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
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
const WHITEBOARD_ROOT = path.join(PRIVATE_ROOT, 'heptabase', 'Whiteboard');
const ARCHIVE_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'empty-heptabase-whiteboards.zip');
const TEMP_ARCHIVE_PATH = path.join(ARCHIVE_ROOT, 'empty-heptabase-whiteboards.tmp.zip');
const PROVENANCE_PATH = path.join(ARCHIVE_ROOT, 'empty-heptabase-whiteboards.json');
const WRITE_FLAG = '--write';
const EMPTY_WHITEBOARD_CONTENT = `# Note Cards

# PDF Cards

# Highlights

# Text Elements

# Insights

# Images

# Videos

# Audios

# Mindmaps`;
const NAMES = [
  'Freelance-Job.md',
  'React 1.md',
  'Software Engineer.md',
  '【2024下期】リーダー.md',
  'エコシステム.md',
  'モノレポ.md',
  'ローカルLLM.md',
];

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
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command}が終了コード${code}で失敗しました: ${stderr.trim()}`));
    });
  });

const validateArchive = async (archivePath) => {
  await run('/usr/bin/unzip', ['-tq', archivePath]);
  const entries = (await run('/usr/bin/unzip', ['-Z1', archivePath]))
    .split('\n')
    .filter((entry) => entry.endsWith('.md'));
  if (entries.length !== NAMES.length)
    throw new Error(`ZIP内のMarkdown件数が不正です: ${entries.length}`);
  return entries.length;
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const present = [];
  const missing = [];
  for (const name of NAMES) {
    const filePath = path.join(WHITEBOARD_ROOT, name);
    if (!(await exists(filePath))) {
      missing.push(name);
      continue;
    }
    const content = (await readFile(filePath, 'utf8')).trim();
    if (content !== EMPTY_WHITEBOARD_CONTENT) throw new Error(`内容が変わっています: ${name}`);
    present.push({ filePath, name });
  }
  const archiveExists = await exists(ARCHIVE_PATH);
  if (present.length === 0 && archiveExists) {
    const archived = await validateArchive(ARCHIVE_PATH);
    console.log(
      JSON.stringify(
        { archived, mode: write ? 'write' : 'dry-run', status: 'already-archived' },
        null,
        2
      )
    );
    return;
  }
  if (missing.length) throw new Error(`一部だけ欠落しています: ${missing.join(', ')}`);
  if (archiveExists) throw new Error(`退避ZIPが既に存在します: ${ARCHIVE_PATH}`);

  console.log(
    JSON.stringify(
      { files: present.map(({ name }) => name), mode: write ? 'write' : 'dry-run' },
      null,
      2
    )
  );
  if (!write) return;
  await mkdir(ARCHIVE_ROOT, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), 'empty-whiteboards-'));
  try {
    for (const { filePath, name } of present) await cp(filePath, path.join(stagingRoot, name));
    await rm(TEMP_ARCHIVE_PATH, { force: true });
    await run('/usr/bin/zip', ['-Xqr', TEMP_ARCHIVE_PATH, '.'], { cwd: stagingRoot });
    await validateArchive(TEMP_ARCHIVE_PATH);
    await rename(TEMP_ARCHIVE_PATH, ARCHIVE_PATH);
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
  await Promise.all(present.map(({ filePath }) => rm(filePath)));
  const archive = await readFile(ARCHIVE_PATH);
  await writeFile(
    PROVENANCE_PATH,
    `${JSON.stringify(
      {
        archive: path.basename(ARCHIVE_PATH),
        files: NAMES,
        sha256: createHash('sha256').update(archive).digest('hex'),
      },
      null,
      2
    )}\n`
  );
  console.log(`[archive-empty-heptabase-whiteboards] ${present.length}件をZIPへ退避しました`);
};

main().catch((error) => {
  console.error('[archive-empty-heptabase-whiteboards] 失敗しました:', error.message);
  process.exitCode = 1;
});
