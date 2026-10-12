#!/usr/bin/env node
import { copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
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
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');
const MAPS_ROOT = path.join(PRIVATE_ROOT, 'maps');
const CLIPPING_ROOT = path.join(PRIVATE_ROOT, 'clipping');
const WRITE_FLAG = '--write';

const MAP_NAMES = [
  'Apache Parquet.md',
  'DORA.md',
  'FTA.md',
  'KPT.md',
  'Orion.md',
  'SPACE.md',
  'TUKURUS.md',
  'V8が行なっていること.md',
  '“use cache“.md',
  'プロトコル.md',
  '要求.md',
];
const NOTE_NAMES = [
  'Codex.md',
  'Expand and Contract.md',
  'MTA.md',
  'アクティビティ.md',
  'コミュニケーションと協働.md',
  'パフォーマンス.md',
  '効率と流れ.md',
  '満足度と幸福度.md',
];
const MOVES = [
  ...MAP_NAMES.map((name) => ({
    destination: path.join(MAPS_ROOT, name),
    source: path.join(NOTES_ROOT, name),
  })),
  ...NOTE_NAMES.map((name) => ({
    destination: path.join(NOTES_ROOT, name),
    source: path.join(MAPS_ROOT, name),
    transform: 'atomic-note',
  })),
  {
    destination: path.join(CLIPPING_ROOT, 'Chaos Engineering.md'),
    source: path.join(NOTES_ROOT, 'Chaos Engineering.md'),
    transform: 'clipping',
  },
];

const ATOMIC_NOTE_CONTENT = {
  'Codex.md': `---\naliases: []\n---\n# Codex\n\nOpenAIのコーディングエージェント。リポジトリを読み、コードの編集やコマンド実行までを一連の作業として扱う。\n`,
  'Expand and Contract.md': `---\naliases:\n  - Parallel Change\n---\n# Expand and Contract\n\n既存利用者との互換性を保ったまま変更する移行パターン。新旧両方を扱える状態へ拡張し、利用側を移行してから旧仕様を削除する。\n`,
  'MTA.md': `---\naliases:\n  - Message Transfer Agent\n---\n# MTA\n\nメールを受け取り、配送先を判断して別のメールサーバーへ転送するソフトウェア。サーバー間の配送には主にSMTPを使う。\n`,
  'アクティビティ.md': `---\naliases:\n  - Activity\n---\n# アクティビティ\n\n[[SPACE]]を構成する観点の一つ。コミット数やデプロイ回数など観測可能な行動量を扱うが、単独では生産性を表さない。\n`,
  'コミュニケーションと協働.md': `---\naliases:\n  - Communication and collaboration\n---\n# コミュニケーションと協働\n\n[[SPACE]]を構成する観点の一つ。情報発見のしやすさ、知識共有、チーム間連携など、協働の質を扱う。\n`,
  'パフォーマンス.md': `---\naliases:\n  - Performance\n---\n# パフォーマンス\n\n[[SPACE]]を構成する観点の一つ。活動量ではなく、品質や信頼性、顧客価値など仕事の成果を扱う。\n`,
  '効率と流れ.md': `---\naliases:\n  - Efficiency and flow\n---\n# 効率と流れ\n\n[[SPACE]]を構成する観点の一つ。中断や待ち時間を抑え、作業を継続的に完了できる状態を扱う。\n`,
  '満足度と幸福度.md': `---\naliases:\n  - Satisfaction and well-being\n---\n# 満足度と幸福度\n\n[[SPACE]]を構成する観点の一つ。仕事への満足、心身の健康、チームへの帰属意識などを扱う。\n`,
};

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
        return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [target] : [];
      })
    )
  ).flat();
};

const normalize = (target) => path.normalize(target).normalize('NFC');
const moveBySource = new Map(MOVES.map((move) => [normalize(move.source), move]));

const encodeRelativePath = (relativePath) =>
  relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment).replaceAll('%5C', '\\'))
    .join('/');

const resolveRelativeTarget = (sourceFile, rawTarget) => {
  if (/^(?:[a-z]+:|#|\/)/iu.test(rawTarget)) return null;
  const [rawPath, anchor = ''] = rawTarget.split('#', 2);
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath.replaceAll('\\', ''));
  } catch {
    return null;
  }
  return { anchor, absolutePath: normalize(path.resolve(path.dirname(sourceFile), decoded)) };
};

const toRelativeTarget = (fromFile, absolutePath, anchor) => {
  let relativePath = path.relative(path.dirname(fromFile), absolutePath);
  if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;
  return `${encodeRelativePath(relativePath)}${anchor ? `#${anchor}` : ''}`;
};

const rewriteMarkdownTargets = (content, originalFile, finalFile) =>
  content.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/gu, (match, prefix, rawTarget, suffix) => {
    const resolved = resolveRelativeTarget(originalFile, rawTarget);
    if (!resolved) return match;
    const movedTarget =
      moveBySource.get(resolved.absolutePath)?.destination ?? resolved.absolutePath;
    if (originalFile === finalFile && movedTarget === resolved.absolutePath) return match;
    return `${prefix}${toRelativeTarget(finalFile, movedTarget, resolved.anchor)}${suffix}`;
  });

const rewriteWikiLinks = (content, originalFile, finalFile) =>
  content.replace(
    /(!?\[\[)([^\]|#]+)((?:[#|][^\]]*)?\]\])/gu,
    (match, prefix, rawTarget, suffix) => {
      if (!rawTarget.startsWith('.')) return match;
      const extension = path.extname(rawTarget) ? '' : '.md';
      const resolved = resolveRelativeTarget(originalFile, `${rawTarget}${extension}`);
      if (!resolved) return match;
      const movedTarget =
        moveBySource.get(resolved.absolutePath)?.destination ?? resolved.absolutePath;
      if (originalFile === finalFile && movedTarget === resolved.absolutePath) return match;
      const relative = toRelativeTarget(finalFile, movedTarget, '').replace(/\.md$/u, '');
      return `${prefix}${decodeURIComponent(relative)}${suffix}`;
    }
  );

const toClipping = (content) => {
  if (content.startsWith('---\n')) return content;
  const source = content.match(/^url:\s*(.+)$/mu)?.[1]?.trim();
  const title = content.match(/^title:\s*["']?(.+?)["']?$/mu)?.[1]?.trim();
  const description = content.match(/^description:\s*["']?(.+?)["']?$/mu)?.[1]?.trim();
  if (!source || !title)
    throw new Error('Chaos Engineeringのcardlinkからメタデータを抽出できません');
  return `---\ntitle: ${JSON.stringify(title)}\nsource: ${JSON.stringify(source)}\ndescription: ${JSON.stringify(description ?? '')}\n---\n\n${content}`;
};

const removeKnownMissingAssets = (content, finalFile) => {
  if (normalize(finalFile) === normalize(path.join(MAPS_ROOT, '“use cache“.md'))) {
    return content.replace(
      /\[ディレクティブ\.md\]\(\.\.\/notes\/%E3%83%87%E3%82%A3%E3%83%AC%E3%82%AF%E3%83%86%E3%82%A3%E3%83%96\.md\)/u,
      'ディレクティブ'
    );
  }
  if (normalize(finalFile) !== normalize(path.join(MAPS_ROOT, 'V8が行なっていること.md'))) {
    return content;
  }
  return content.replace(/\n*!\[Pasted 2024-05-09-04-05-49\.png\]\([^\n]+\)\n*/u, '\n\n');
};

const moveEntry = async ({ destination, source }) => {
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    await rename(source, destination);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    const sourceStat = await stat(source);
    if (sourceStat.isDirectory())
      throw new Error(`異なるファイルシステム間のディレクトリ移動には未対応です: ${source}`);
    await copyFile(source, destination);
    await rm(source);
  }
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const activeMoves = [];
  for (const move of MOVES) {
    const [sourceExists, destinationExists] = await Promise.all([
      exists(move.source),
      exists(move.destination),
    ]);
    if (!sourceExists && destinationExists) continue;
    if (!sourceExists) throw new Error(`移動元がありません: ${move.source}`);
    if (destinationExists) throw new Error(`移動先が既に存在します: ${move.destination}`);
    activeMoves.push(move);
  }

  const markdownFiles = await collectMarkdownFiles(VAULT_ROOT);
  const rewrites = [];
  for (const originalFile of markdownFiles) {
    const move = moveBySource.get(normalize(originalFile));
    const finalFile = move?.destination ?? originalFile;
    let before = await readFile(originalFile, 'utf8');
    let after = rewriteWikiLinks(
      rewriteMarkdownTargets(before, originalFile, finalFile),
      originalFile,
      finalFile
    );
    if (move?.transform === 'clipping') after = toClipping(after);
    if (move?.transform === 'atomic-note') after = ATOMIC_NOTE_CONTENT[path.basename(finalFile)];
    after = removeKnownMissingAssets(after, finalFile);
    if (before !== after || move) rewrites.push({ after, finalFile, originalFile });
  }

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        moves: activeMoves.map(({ destination, source }) => ({
          destination: path.relative(VAULT_ROOT, destination),
          source: path.relative(VAULT_ROOT, source),
        })),
        rewrittenMarkdownFiles: rewrites.filter(
          ({ after, originalFile }) => after !== undefined && originalFile
        ).length,
      },
      null,
      2
    )
  );
  if (!write) return;

  for (const move of activeMoves.filter(({ source }) => !source.endsWith('.md')))
    await moveEntry(move);
  for (const { after, finalFile } of rewrites) {
    await mkdir(path.dirname(finalFile), { recursive: true });
    await writeFile(finalFile, after);
  }
  for (const move of activeMoves.filter(({ source }) => source.endsWith('.md')))
    await rm(move.source);

  const remainingFiles = await collectMarkdownFiles(VAULT_ROOT);
  const staleReferences = [];
  for (const file of remainingFiles) {
    const content = await readFile(file, 'utf8');
    for (const { source } of activeMoves) {
      if (!source.endsWith('.md')) continue;
      const basename = path.basename(source);
      if (content.includes(`./${basename}`) && path.dirname(file) === path.dirname(source)) {
        staleReferences.push(path.relative(VAULT_ROOT, file));
      }
    }
  }
  if (staleReferences.length > 0)
    throw new Error(`移動元への参照が残っています: ${[...new Set(staleReferences)].join(', ')}`);
  console.log(
    `[organize-obsidian-atomic-notes] ${activeMoves.length}件を移動し、参照を更新しました`
  );
};

main().catch((error) => {
  console.error('[organize-obsidian-atomic-notes] 失敗しました:', error.message);
  process.exitCode = 1;
});
