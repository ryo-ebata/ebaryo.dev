#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const checks = [
  {
    files: [
      'app/write/writer-analysis-panel.module.css',
      'app/write/writer-article-picker.module.css',
      'app/write/writer-metadata-settings.module.css',
      'app/write/writer-tag-picker.module.css',
      'app/write/writer-thumbnail-settings.module.css',
    ],
    forbidden: [/var\(--ink\)/g, /var\(--line\)/g, /var\(--muted\)/g, /var\(--accent\)/g],
    reason: 'Writerでは領域固有の--writer-*トークンを使う',
  },
  {
    files: ['app/write/writer-preview.module.css'],
    forbidden: [/@media\s*\(prefers-color-scheme:/g],
    reason: '明示的なサイトテーマをOSテーマより優先する',
  },
];

const violations = [];
for (const check of checks) {
  for (const file of check.files) {
    const source = await readFile(file, 'utf8');
    for (const pattern of check.forbidden) {
      const matches = source.match(pattern) ?? [];
      if (matches.length > 0) {
        violations.push({ file, matches: [...new Set(matches)], reason: check.reason });
      }
    }
  }
}

const globals = await readFile('app/globals.css', 'utf8');
for (const required of [
  'color-scheme: light',
  'color-scheme: dark',
  'prefers-reduced-motion: reduce',
]) {
  if (!globals.includes(required)) {
    violations.push({
      file: 'app/globals.css',
      matches: [required],
      reason: '必須のテーマ・モーション宣言がない',
    });
  }
}

console.log(JSON.stringify({ checks: checks.length + 1, violations }, null, 2));
if (violations.length > 0) process.exitCode = 1;
