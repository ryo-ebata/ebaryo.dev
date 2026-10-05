import type { ArticlePickerMode, MaintenanceIssue } from './writer-model';

export const WRITING_BLOCKS = [
  { label: '導入', text: '## はじめに\n\nこの記事で分かることを簡潔に書く。\n\n' },
  {
    label: '比較表',
    text: '| 項目 | 選択肢A | 選択肢B |\n| --- | --- | --- |\n| 特徴 |  |  |\n\n',
  },
  { label: '手順', text: '## 手順\n\n1. \n2. \n3. \n\n' },
  { label: 'まとめ', text: '## まとめ\n\n要点を簡潔に振り返る。\n\n' },
] as const;

export const STAGE_LABELS = {
  idea: 'アイデア',
  published: '公開済み',
  review: '推敲待ち',
  writing: '執筆中',
} as const;

export const ARTICLE_PICKER_MODES = [
  ['all', 'すべて'],
  ['draft', '下書き'],
  ['idea', 'アイデア'],
  ['writing', '執筆中'],
  ['review', '推敲待ち'],
  ['published', '公開済み'],
  ['maintenance', '要メンテ'],
] as const satisfies ReadonlyArray<readonly [ArticlePickerMode, string]>;

export const ARTICLE_PICKER_HEADINGS: Record<ArticlePickerMode, string> = {
  all: '最近更新',
  draft: 'すべての下書き',
  idea: '書き始める記事',
  maintenance: '改善する記事',
  published: '公開した記事',
  review: '公開前に見直す記事',
  writing: '続きを書く記事',
};

export const MAINTENANCE_LABELS: Record<MaintenanceIssue, string> = {
  'broken-link': 'リンク切れ',
  'missing-eyecatch': '画像なし',
  'missing-tags': 'タグなし',
  orphaned: '孤立',
  'short-content': '短い本文',
  stale: '更新候補',
};

export const MAINTENANCE_ACTIONS: Record<MaintenanceIssue, string> = {
  'broken-link': 'リンク先を修正または削除する',
  'missing-eyecatch': 'サムネイルを追加する',
  'missing-tags': '内容に合うタグを追加する',
  orphaned: '関連記事から内部リンクを追加する',
  'short-content': '不足している説明や具体例を補う',
  stale: '情報とリンクが現在も正しいか確認する',
};
