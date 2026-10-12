#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const templatePath = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  '.obsidian',
  'web-clipper-templates',
  'blog-clipping.json'
);
const template = JSON.parse(await readFile(templatePath, 'utf8'));
const desired = [
  { name: 'tags', type: 'multitext', value: 'source/web' },
  { name: 'type', type: 'text', value: 'clipping' },
  { name: 'status', type: 'text', value: 'unread' },
];
for (const property of desired) {
  const index = template.properties.findIndex(({ name }) => name === property.name);
  if (index >= 0) template.properties[index] = property;
  else template.properties.push(property);
}
await writeFile(templatePath, `${JSON.stringify(template, null, 2)}\n`);
console.log('[configure-obsidian-capture-properties] Clipperプロパティを更新しました');
