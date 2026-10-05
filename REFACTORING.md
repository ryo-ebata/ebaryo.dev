# Refactoring roadmap

優先度は `(影響度 + 放置リスク) × (6 - 工数)` で算出する。各値は5段階。

## 完了

- Writerからタグ選択を`writer-tag-picker.tsx`へ分離
- WriterからPrivateノート・公開記事検索を`writer-link-library.tsx`へ分離
- Wikiリンクの公開変換をMarkdownパイプラインへ集約
- ローカルホスト判定を`lib/local-only.ts`へ集約
- Writerの復元・読込・保存・新規作成を`use-writer-document.ts`へ分離
- Writerの校正処理を`use-writer-lint.ts`へ分離
- Writerの画像アップロード・サムネイル生成を`use-writer-images.ts`へ分離
- Writerの記事検索・選択を`writer-article-picker.tsx`へ分離
- Writerのカーソル・Markdown編集を`use-writer-editor.ts`へ分離
- Writerの記事選択・リンク検索・タグ選択CSSを各コンポーネントへ分離
- Writer・PortfolioのローカルAPI認可とエラー応答を`lib/local-api.ts`へ集約
- Writerのサイドパネル枠・タブ・Backdropを`writer-inspector.tsx`へ分離
- Writerの保存先・公開状態・記事情報・SEO詳細を`writer-metadata-settings.tsx`へ分離
- Writerのサムネイル生成・デザイン選択・画像設定を`writer-thumbnail-settings.tsx`へ分離
- Writerの構成分析・見出し移動・関連記事候補を`writer-analysis-panel.tsx`へ分離
- Writerの校正結果・本文移動・修正案適用を`writer-review-panel.tsx`へ分離
- Writerの公開進捗・blocker・warning表示を`writer-publication-readiness.tsx`へ分離
- Writerの分析・校正パネルCSSを各コンポーネントのCSS Moduleへ分離
- Writerの公開準備CSSを専用CSS Moduleへ分離
- Writerのサムネイル生成・画像設定CSSを専用CSS Moduleへ分離
- Writerの公開状態・SEO詳細CSSを専用CSS Moduleへ分離
- WriterのInspector枠・共通フォームCSSを専用CSS Moduleへ分離
- 外部記事サムネイルをビルド時生成する静的Route Handlerへ変更

## 次フェーズ

1. `app/write/writer.module.css`: ヘッダーとエディター領域の責務を分割。スコア20
2. Portfolio表示・管理: カテゴリ定義、装飾、フォーム変換を集約。スコア18
3. OG画像: 描画ロジックを分割し、レイアウト追加時の回帰範囲を縮小。スコア14

## 実施順

1. Writer CSSのヘッダーとエディター領域を分離
2. Portfolioカテゴリ定義とカード描画を共通化
3. OG画像の描画ロジックを分離
