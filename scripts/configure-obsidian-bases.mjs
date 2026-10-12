#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const BASES_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'bases'
);

const condition = (field, operator, value) => ({
  field,
  operator,
  ...(value === undefined ? {} : { value }),
});
const columns = (...fields) => fields.map((field) => ({ field }));

const bases = {
  'Knowledge Notes.base': {
    filter: { conjunction: 'and', conditions: [condition('type', 'equals', 'note')] },
    order: [
      { field: 'status', direction: 'ascending' },
      { field: 'file.mtime', direction: 'descending' },
    ],
    columns: columns('file.name', 'status', 'tags', 'maps', 'sources', 'aliases', 'file.mtime'),
  },
  'Seeds.base': {
    filter: {
      conjunction: 'and',
      conditions: [condition('type', 'equals', 'note'), condition('status', 'equals', 'seed')],
    },
    order: [{ field: 'file.mtime', direction: 'descending' }],
    columns: columns('file.name', 'tags', 'maps', 'sources', 'file.mtime'),
  },
  'Reading Queue.base': {
    filter: {
      conjunction: 'or',
      conditions: [
        {
          conjunction: 'and',
          conditions: [
            condition('type', 'equals', 'clipping'),
            condition('status', 'equals', 'unread'),
          ],
        },
        {
          conjunction: 'and',
          conditions: [
            condition('type', 'equals', 'book'),
            condition('status', 'equals', 'reading'),
          ],
        },
      ],
    },
    order: [{ field: 'file.mtime', direction: 'descending' }],
    columns: columns('file.name', 'type', 'status', 'tags', 'author', 'created', 'file.mtime'),
  },
  'Orphan Notes.base': {
    filter: {
      conjunction: 'and',
      conditions: [condition('type', 'equals', 'note'), condition('maps', 'is-empty')],
    },
    order: [{ field: 'file.mtime', direction: 'descending' }],
    columns: columns('file.name', 'status', 'tags', 'sources', 'file.mtime'),
  },
  'Distilled Sources.base': {
    filter: {
      conjunction: 'and',
      conditions: [condition('status', 'equals', 'distilled')],
    },
    order: [{ field: 'file.mtime', direction: 'descending' }],
    columns: columns('file.name', 'type', 'tags', 'author', 'source', 'file.mtime'),
  },
};

await mkdir(BASES_ROOT, { recursive: true });
for (const [name, definition] of Object.entries(bases)) {
  await writeFile(path.join(BASES_ROOT, name), `${JSON.stringify(definition, null, 2)}\n`);
}
console.log(`[configure-obsidian-bases] ${Object.keys(bases).length}件を作成しました`);
