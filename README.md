# ebaryo.dev

技術的な学びや日々の気づきを共有する技術ブログです。

## 技術スタック

| カテゴリ       | 技術                                           |
| -------------- | ---------------------------------------------- |
| フレームワーク | [Next.js](https://nextjs.org) 16 (App Router)  |
| UI ライブラリ  | [React](https://react.dev) 19                  |
| 言語           | [TypeScript](https://www.typescriptlang.org) 7 |
| スタイリング   | [Tailwind CSS](https://tailwindcss.com) 4      |
| 実行環境       | Vercel / Cloudflare Workers(OpenNext)          |
| コンテンツ管理 | Obsidian Vault(`blog-obsidian/`)内のMarkdown   |

## 開発ツール

| ツール                                             | 用途           |
| -------------------------------------------------- | -------------- |
| [oxlint](https://oxc.rs/docs/guide/usage/linter)   | リンター       |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter) | フォーマッター |
| [Vitest](https://vitest.dev)                       | ユニットテスト |
| [Playwright](https://playwright.dev)               | E2Eテスト      |
| [Storybook](https://storybook.js.org)              | UIカタログ     |

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# .env.local に必要な環境変数を設定

# 開発サーバーの起動
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## スクリプト

| コマンド                            | 説明                          |
| ----------------------------------- | ----------------------------- |
| `pnpm dev`                          | 開発サーバーを起動            |
| `pnpm build`                        | プロダクションビルド          |
| `pnpm build:cloudflare`             | Cloudflare Workerをビルド     |
| `pnpm preview:cloudflare`           | Workerをローカルで確認        |
| `pnpm check:cloudflare-concurrency` | 起動済みWorkerへ並行アクセス  |
| `pnpm cf:typegen`                   | Cloudflare binding型を更新    |
| `pnpm start`                        | プロダクションサーバーを起動  |
| `pnpm lint`                         | oxlint でリント実行           |
| `pnpm lint:fix`                     | oxlint で自動修正             |
| `pnpm format`                       | oxfmt でフォーマット          |
| `pnpm format:check`                 | フォーマットチェック          |
| `pnpm check`                        | リント + フォーマットチェック |
| `pnpm test`                         | Vitest でテスト実行           |
| `pnpm test:unit`                    | ユニットテストのみ実行        |
| `pnpm test:e2e`                     | Playwright で E2E テスト実行  |
| `pnpm test:coverage`                | テストカバレッジ計測          |
| `pnpm storybook`                    | Storybook を起動              |

## ディレクトリ構造

```
├── app/                # Next.js App Router ページ
├── components/
│   ├── atoms/          # 最小単位のUIコンポーネント
│   ├── molecules/      # 複合コンポーネント
│   └── organisms/      # 複雑なUIコンポーネント
├── config/             # 設定ファイル
└── lib/                # ユーティリティ・ロジック
```

## アーキテクチャ

Container/Presenter パターンを採用しています。

- **page.tsx** - ルーティング・メタデータ定義
- **container.tsx** - データ取得・ロジック
- **presenter.tsx** - UI の描画
