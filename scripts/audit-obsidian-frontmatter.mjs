#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

const PRIVATE_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private'
);
const EXPECTED_TYPES = {
  clipping: 'clipping',
  kindle: 'book',
  maps: 'map',
  notes: 'note',
};
const ALLOWED_STATUS = {
  clipping: new Set(['unread', 'distilled']),
  kindle: new Set(['reading', 'distilled']),
  maps: new Set(['active']),
  notes: new Set(['seed', 'growing', 'evergreen']),
};

const collectMarkdown = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdown(target)));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(target);
  }
  return files;
};

const main = async () => {
  const sections = {};
  const errors = [];
  for (const [directory, expectedType] of Object.entries(EXPECTED_TYPES)) {
    const files = await collectMarkdown(path.join(PRIVATE_ROOT, directory));
    const counts = {
      aliases: 0,
      files: files.length,
      frontmatter: 0,
      statuses: {},
      tags: 0,
      typed: 0,
    };
    for (const filePath of files) {
      const source = await readFile(filePath, 'utf8');
      const relative = path.relative(PRIVATE_ROOT, filePath);
      if (!source.startsWith('---\n')) {
        errors.push(`${relative}: フロントマターなし`);
        continue;
      }
      counts.frontmatter += 1;
      let data;
      try {
        data = matter(source).data;
      } catch (error) {
        errors.push(`${relative}: YAML不正 (${error.message})`);
        continue;
      }
      if (data.type === expectedType) counts.typed += 1;
      else errors.push(`${relative}: typeは${expectedType}であるべき`);
      if (Array.isArray(data.tags) && data.tags.length > 0) counts.tags += 1;
      for (const tag of data.tags ?? []) {
        if (!/^(topic|source|project)\/[a-z0-9-]+$/u.test(tag)) {
          errors.push(`${relative}: 不正なタグ ${tag}`);
        }
      }
      if (Array.isArray(data.aliases) && data.aliases.length > 0) counts.aliases += 1;
      if (Array.isArray(data.aliases) && data.aliases.length === 0) {
        errors.push(`${relative}: 空のaliases`);
      }
      if (!ALLOWED_STATUS[directory].has(data.status)) {
        errors.push(`${relative}: 不正なstatus ${String(data.status)}`);
      } else {
        counts.statuses[data.status] = (counts.statuses[data.status] ?? 0) + 1;
      }
      const title = path.basename(filePath, '.md').normalize('NFC');
      if ((data.aliases ?? []).some((alias) => String(alias).normalize('NFC') === title)) {
        errors.push(`${relative}: ファイル名と同じalias`);
      }
      if (directory === 'maps' && !(Array.isArray(data.tags) && data.tags.length > 0)) {
        errors.push(`${relative}: Mapには意味タグが必要`);
      }
      if (directory === 'notes') {
        if (data.maps !== undefined && !Array.isArray(data.maps)) {
          errors.push(`${relative}: mapsが配列ではない`);
        }
        if (data.sources !== undefined && !Array.isArray(data.sources)) {
          errors.push(`${relative}: sourcesが配列ではない`);
        }
      }
      if (directory === 'clipping' && !data.tags?.includes('source/web')) {
        errors.push(`${relative}: source/webがない`);
      }
      if (directory === 'kindle' && !data.tags?.includes('source/kindle')) {
        errors.push(`${relative}: source/kindleがない`);
      }
    }
    sections[directory] = counts;
  }
  console.log(JSON.stringify({ errors, sections }, null, 2));
  if (errors.length > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error('[audit-obsidian-frontmatter] 失敗しました:', error.message);
  process.exitCode = 1;
});
