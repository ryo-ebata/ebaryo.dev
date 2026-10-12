#!/usr/bin/env node
import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
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
const NOTES_ROOT = path.join(VAULT_ROOT, 'private', 'notes');
const WRITE_FLAG = '--write';
const CONSOLIDATIONS = [
  { canonical: 'Golang.md', sources: ['Golang 2.md'] },
  { canonical: 'Java仮想マシン.md', sources: ['Java仮想マシン 1.md'] },
  { canonical: 'スタック.md', sources: ['スタック 1.md'] },
  { canonical: 'パフォーマンステスト.md', sources: ['パフォーマンステスト 1.md'] },
  { canonical: '借用.md', sources: ['借用 1.md'] },
  {
    canonical: 'TypeScript.md',
    sources: ['TypeScript 1.md', 'TypeScript 2.md'],
    content: `---\ntags:\n  - language\n---\n# TypeScript\n\nTypeScriptはJavaScriptに静的な型検査を加える言語。型情報はビルド時に取り除かれ、JavaScriptとして実行される。\n\n## 強み\n\n- [JavaScript.md](./JavaScript.md)のエコシステムを利用できる\n- フロントエンドだけでなく、Node.jsやDenoによるサーバーサイド開発にも使える\n- tRPCやPrismaの生成型を使い、API・データ層との型共有をしやすい\n\n## 注意点\n\n- 型安全性は実行時の入力まで自動では保証しない\n- 実行性能はJavaScriptランタイムに依存し、CPU負荷の高い処理では別言語も選択肢になる\n`,
  },
];

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
        if (entry.isDirectory() && entry.name !== '.obsidian') return collectMarkdownFiles(target);
        return entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
      })
    )
  ).flat();
};

const normalize = (target) => path.normalize(target).normalize('NFC');
const destinationBySource = new Map(
  CONSOLIDATIONS.flatMap(({ canonical, sources }) =>
    sources.map((source) => [
      normalize(path.join(NOTES_ROOT, source)),
      normalize(path.join(NOTES_ROOT, canonical)),
    ])
  )
);

const resolveTarget = (sourceFile, rawTarget) => {
  if (/^(?:[a-z]+:|#|\/)/iu.test(rawTarget)) return null;
  const [rawPath, anchor = ''] = rawTarget.split('#', 2);
  try {
    return {
      absolutePath: normalize(
        path.resolve(path.dirname(sourceFile), decodeURIComponent(rawPath.replaceAll('\\', '')))
      ),
      anchor,
    };
  } catch {
    return null;
  }
};

const encodeRelativePath = (relativePath) =>
  relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment).replaceAll('%5C', '\\'))
    .join('/');

const relativeTarget = (sourceFile, destination, anchor) => {
  let relative = path.relative(path.dirname(sourceFile), destination);
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return `${encodeRelativePath(relative)}${anchor ? `#${anchor}` : ''}`;
};

const rewriteLinks = (content, sourceFile) => {
  const markdown = content.replace(
    /(!?\[[^\]]*\]\()([^)]+)(\))/gu,
    (match, prefix, rawTarget, suffix) => {
      const resolved = resolveTarget(sourceFile, rawTarget);
      const destination = resolved && destinationBySource.get(resolved.absolutePath);
      return destination
        ? `${prefix}${relativeTarget(sourceFile, destination, resolved.anchor)}${suffix}`
        : match;
    }
  );
  return markdown.replace(
    /(!?\[\[)([^\]|#]+)((?:[#|][^\]]*)?\]\])/gu,
    (match, prefix, rawTarget, suffix) => {
      const sourceName = `${path.basename(rawTarget)}.md`.normalize('NFC');
      const consolidation = CONSOLIDATIONS.find(({ sources }) =>
        sources.some((source) => source.normalize('NFC') === sourceName)
      );
      return consolidation
        ? `${prefix}${path.basename(consolidation.canonical, '.md')}${suffix}`
        : match;
    }
  );
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const active = [];
  for (const consolidation of CONSOLIDATIONS) {
    const sources = [];
    for (const source of consolidation.sources) {
      const sourcePath = path.join(NOTES_ROOT, source);
      if (await exists(sourcePath)) sources.push(sourcePath);
    }
    if (sources.length > 0) active.push({ ...consolidation, sources });
  }

  const sourcePaths = new Set(active.flatMap(({ sources }) => sources.map(normalize)));
  const rewrites = [];
  for (const filePath of await collectMarkdownFiles(VAULT_ROOT)) {
    if (sourcePaths.has(normalize(filePath))) continue;
    const before = await readFile(filePath, 'utf8');
    const after = rewriteLinks(before, filePath);
    if (after !== before) rewrites.push({ after, filePath });
  }

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        consolidations: active.map(({ canonical, sources }) => ({
          canonical,
          sources: sources.map((source) => path.basename(source)),
        })),
        rewrittenMarkdownFiles: rewrites.length,
      },
      null,
      2
    )
  );
  if (!write) return;

  for (const consolidation of active) {
    const canonicalPath = path.join(NOTES_ROOT, consolidation.canonical);
    const canonicalExists = await exists(canonicalPath);
    const sourceContent = await readFile(consolidation.sources[0], 'utf8');
    if (!canonicalExists || consolidation.content) {
      await writeFile(canonicalPath, consolidation.content ?? sourceContent);
    }
  }
  await Promise.all(rewrites.map(({ after, filePath }) => writeFile(filePath, after)));
  await Promise.all([...sourcePaths].map((source) => rm(source)));
  console.log(`[consolidate-numbered-obsidian-notes] ${active.length}件を統合しました`);
};

main().catch((error) => {
  console.error('[consolidate-numbered-obsidian-notes] 失敗しました:', error.message);
  process.exitCode = 1;
});
