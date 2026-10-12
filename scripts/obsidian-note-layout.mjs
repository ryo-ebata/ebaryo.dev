export const ARCHIVED_NOTE_NAMES = new Set([
  '2026-06-18 PPランチ.md',
  'ChatGPT ChatとCodexの使い分け.md',
  'Dynamic Context Management Markdown.md',
  'HeptabaseやめてObsidian始めたけど、結局Heptabaseに戻ってきた話.md',
  'Obsidian：InputとOutputの超ループ計画.md',
  'PRPRP.md',
  'Scalaとテンプレートエンジンによるウェブアプリ開発入門ガイド.md',
  'Shai-HuludとReact, Next.jsのCVEで高まったセキュリティ意識.md',
  'Slackのtimes channelに書き込まなくなった.md',
  'Untitled.md',
  'Vercelの掲げるディレクティブベースプログラミングについての意見書.md',
  'template.md',
  '「レンズ」で世界を見る技法——安斎勇樹の探究論と「4つの目」フレームワークの接点.md',
  '『開発速度が遅い』と言われたとき、何を疑うべきか.md',
  'インターフェイスとプロトコルの違い.md',
  'ソフトウェア品質戦略入門 (2).md',
  '市川メソッド.md',
  '無題のファイル.md',
  '第70回有馬記念やってきました.md',
  '練習問題.md',
  '読書メモ.md',
]);

export const shouldArchiveLegacyNote = (sourceCategory, basename) =>
  sourceCategory === 'Blog' ||
  (['Inbox', 'Map Of Contents'].includes(sourceCategory) &&
    ARCHIVED_NOTE_NAMES.has(basename.normalize('NFC')));
