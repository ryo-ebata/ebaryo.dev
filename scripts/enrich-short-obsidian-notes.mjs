#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const NOTES_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'notes'
);
const WRITE_FLAG = '--write';
const CONTENTS = {
  'Next.js v16': `# Next.js v16

Next.js 16ではTurbopackが開発・本番ビルドの既定となり、Cache Componentsと[“use cache“.md](../maps/%E2%80%9Cuse%20cache%E2%80%9C.md)を中心に、静的部分と動的部分を明示的に構成する。

同期的なRequest APIや旧Middlewareなど、以前の互換挙動から移行するための破壊的変更も含まれる。
`,
  'Atlas（H）': `# Atlas（H）

プロ面談の会話を要約・分析し、確認や振り返りに使える情報へ変換するAIツール。
`,
  NestJS: `# NestJS

Node.js上で動く、TypeScript中心のサーバーサイドフレームワーク。モジュールと依存性注入によってアプリケーションを構成する。

モジュール間で相互依存を作ると循環参照が起きやすいため、責務の境界を見直す必要がある。
`,
  PostgreSQL: `---
tags:
  - db
---
# PostgreSQL

標準SQLへの準拠と拡張性を重視したオープンソースのリレーショナルデータベース管理システム。
`,
  SLI: `# SLI

Service Level Indicator。サービス品質を観測するための具体的な測定値。

可用性・レイテンシー・エラー率などを数値化し、[[SLO]]を満たしているか判断する材料にする。
`,
  stale: `# stale

cacheLifeのstaleは、クライアントルーターがサーバーへ確認せずにキャッシュ済みデータを利用できる期間。

期間を過ぎると次のナビゲーションでサーバーへ確認する。Cache-Controlではなく、Next.jsのクライアントキャッシュに作用する。
`,
  'ts-nodeならTypeScriptのを解釈実行': `# ts-nodeならTypeScriptのを解釈実行

ts-nodeはTypeScriptを実行時に変換し、事前にJavaScriptファイルを生成せずNode.js上で実行できる。

開発時のスクリプト実行には便利だが、本番ではビルド時間と実行環境を分離したほうが予測しやすい。
`,
  Web開発におけるライブラリが潤沢: `# Web開発におけるライブラリが潤沢

Web開発では、UI・通信・認証・検証・テストなどの課題に対して多くのライブラリを利用できる。

選択肢の多さは開発を速める一方、保守状況・依存関係・標準機能で代替できるかを確認する必要がある。
`,
  サービス復旧時間: `---
aliases:
  - Time to restore service
---
# サービス復旧時間

障害や変更失敗によって低下したサービスを、通常の状態へ戻すまでにかかる時間。

短いほど、検知・切り戻し・修復の仕組みが機能していることを示す。
`,
  デプロイ頻度: `---
aliases:
  - Deployment frequency
---
# デプロイ頻度

変更を本番環境へデプロイする頻度。

高い頻度を安全に維持できることは、変更を小さく分けて継続的に届けられる状態を示す。
`,
  ルートノード: `# ルートノード

木構造の起点となる、親を持たない唯一のノード。ほかのノードはルートノードから子孫として辿れる。
`,
  変更のリードタイム: `---
aliases:
  - Lead time for changes
---
# 変更のリードタイム

コード変更がコミットされてから、本番環境で利用可能になるまでの所要時間。

短いほど、レビュー・テスト・デプロイを含む変更フローが滑らかに進んでいることを示す。
`,
  変更失敗率: `---
aliases:
  - Change failure rate
---
# 変更失敗率

本番への変更のうち、障害・品質低下・切り戻し・緊急修正につながった変更の割合。

低いほど、変更を安全に検証して届けられていることを示す。
`,
  通知やリマインダーを活用する: `# 通知やリマインダーを活用する

習慣にしたい行動を決まった時刻や既存の行動と結び付け、通知を開始の合図として使う。

思い出すための負荷を外部へ移すことで、行動を始める確率を上げられる。
`,
  'SQL COUNT()': `# SQL COUNT()

COUNT()は条件に一致する行数を集計するSQL関数。COUNT(*)は行数を数え、COUNT(列名)はNULLではない値を数える。

常に高速とは限らず、対象範囲・インデックス・データベースの実行計画によってコストが変わる。
`,
  Laravel: `# Laravel

Laravelは[PHP.md](./PHP.md)でWebアプリケーションを構築するためのフレームワーク。

ルーティング・依存性注入・ORM・ジョブなどを統合し、内部ではSymfonyの複数コンポーネントを利用している。
`,
  マルチターゲット言語: `# マルチターゲット言語

同じ言語やコードから、複数の実行環境・命令セット・出力形式を対象にコンパイルできる言語。

ターゲット間でコードを共有できる一方、利用可能なAPIや実行時の差異を吸収する設計が必要になる。
`,
  'データのシリアライズ（直列化）': `# データのシリアライズ（直列化）

メモリ上のデータ構造を、保存・送信できる連続した形式へ変換すること。JSON・Protocol Buffers・MessagePackなどの形式がある。

元のデータ構造へ戻す処理をデシリアライズという。
`,
  バイナリへのコンパイル: `# バイナリへのコンパイル

ソースコードを、実行環境が直接読み込める実行可能形式へ事前に変換すること。

実行時の変換コストを減らせる一方、OSやCPUアーキテクチャーごとに成果物を用意する場合がある。
`,
  フロントエンドとの型共有が容易: `# フロントエンドとの型共有が容易

フロントエンドとバックエンドが同じ型定義を参照すると、APIの入力・出力の不一致を開発時に検出しやすい。

tRPCや共有パッケージを使えるが、実行時の入力検証まで型だけで代替することはできない。
`,
  万能チューリングマシン: `# 万能チューリングマシン

任意のチューリングマシンの記述と入力を受け取り、その計算を模倣できる抽象的な計算機。

特定の処理専用ではなく、記述された命令に応じてさまざまな計算を実行できる。
`,
  作り手の多様性: `# 作り手の多様性

異なる役割・経験・働き方を持つ人が、同じプロダクトや意思決定へ参加している状態。

- [[役割による多様性]]
- [[経験による多様性]]
- [[働き方による多様性]]

視点の幅を増やせる一方、前提や言葉の違いを調整する仕組みが必要になる。
`,
};

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const updates = [];
  for (const [name, content] of Object.entries(CONTENTS)) {
    const filePath = path.join(NOTES_ROOT, `${name}.md`);
    if (!(await exists(filePath))) throw new Error(`対象ノートがありません: ${name}.md`);
    const current = await readFile(filePath, 'utf8');
    if (current !== content) updates.push({ content, filePath });
  }
  console.log(
    JSON.stringify(
      {
        files: updates.map(({ filePath }) => path.basename(filePath)),
        mode: write ? 'write' : 'dry-run',
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[enrich-short-obsidian-notes] ${updates.length}件を補強しました`);
};

main().catch((error) => {
  console.error('[enrich-short-obsidian-notes] 失敗しました:', error.message);
  process.exitCode = 1;
});
