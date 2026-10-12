#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DOWNLOADS_ROOT = path.join(os.homedir(), 'Downloads');
const PRIVATE_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private'
);
const WRITE_FLAG = '--write';
const MARKER = '## Heptabase Journal';

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const findExport = async () => {
  const entries = await readdir(DOWNLOADS_ROOT, { withFileTypes: true });
  const latest = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('Heptabase-Data-Backup-'))
    .map(({ name }) => name)
    .sort()
    .at(-1);
  if (!latest) throw new Error('Heptabaseエクスポートが見つかりません');
  return path.join(DOWNLOADS_ROOT, latest);
};

const normalizeBody = (source) =>
  source
    .trim()
    .replace(/^#{1,4}(?=\s)/gm, (heading) => `${heading}##`)
    .replaceAll('\\~', '~')
    .replace(/\n{3,}/g, '\n\n');

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const exportRoot = await findExport();
  const journalRoot = path.join(exportRoot, 'Journal');
  const names = (await readdir(journalRoot)).filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name));
  const updates = [];

  for (const name of names) {
    const body = normalizeBody(await readFile(path.join(journalRoot, name), 'utf8'));
    if (!body) continue;
    const date = name.slice(0, -3);
    const [year, month] = date.split('-');
    const destination = path.join(PRIVATE_ROOT, 'daily', year, month, name);
    const current = (await exists(destination)) ? await readFile(destination, 'utf8') : '';
    if (current.includes(MARKER)) continue;
    const content = `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${MARKER}\n\n${body}\n`;
    updates.push({ content, destination, kind: current.trim() ? 'merge' : 'create' });
  }

  console.log(
    JSON.stringify(
      {
        creates: updates.filter(({ kind }) => kind === 'create').length,
        merges: updates.filter(({ kind }) => kind === 'merge').length,
        mode: write ? 'write' : 'dry-run',
        source: path.relative(os.homedir(), journalRoot),
        total: updates.length,
      },
      null,
      2
    )
  );
  if (!write) return;
  for (const { content, destination } of updates) {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  console.log(`[import-heptabase-journals] ${updates.length}日分を統合しました`);
};

main().catch((error) => {
  console.error('[import-heptabase-journals] 失敗しました:', error.message);
  process.exitCode = 1;
});
