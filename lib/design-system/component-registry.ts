export type ComponentCategory = 'Atoms' | 'Molecules' | 'Organisms' | 'Patterns';

export interface ComponentSpec {
  accessibility: string;
  category: ComponentCategory;
  name: string;
  purpose: string;
  states: string;
}

const atom = (name: string, purpose: string, states = 'default'): ComponentSpec => ({
  accessibility: '意味に合うHTMLと可視フォーカスを保つ',
  category: 'Atoms',
  name,
  purpose,
  states,
});
const molecule = (name: string, purpose: string, states = 'default'): ComponentSpec => ({
  accessibility: '子要素の名前・順序・状態通知を保つ',
  category: 'Molecules',
  name,
  purpose,
  states,
});
const organism = (name: string, purpose: string, states = 'default'): ComponentSpec => ({
  accessibility: 'ランドマークと見出し階層を保つ',
  category: 'Organisms',
  name,
  purpose,
  states,
});
const pattern = (name: string, purpose: string, states = 'default'): ComponentSpec => ({
  accessibility: '複合操作のフォーカス順序・状態通知・キーボード操作を保つ',
  category: 'Patterns',
  name,
  purpose,
  states,
});

export const componentRegistry: ComponentSpec[] = [
  atom('BackLink', '前の階層へ戻る', 'default / hover / focus'),
  atom('Badge', '状態や分類を表示', '8 variants'),
  atom('Button', 'ボタン操作', '6 variants / 7 sizes / disabled'),
  atom('Card', '関連する情報をまとめる'),
  atom('Empty', 'データがない時の表示'),
  atom('Input', '一行の文字入力', 'default / focus / invalid / disabled'),
  atom('SearchInput', '記事検索とクリア', 'empty / filled / focus'),
  atom('Separator', '情報の区切り', 'horizontal / vertical'),
  atom('Skeleton', '読み込み中の仮表示', 'loading'),
  atom('Table', '表形式のデータ表示'),
  atom('ThemeToggle', 'ライト・ダークの切り替え', 'light / dark'),
  atom('Time', '日時の表示'),
  molecule('AffiliateCard', '商品リンクと広告表示'),
  molecule('AffiliateDisclosure', '広告であることを表示'),
  molecule('AdUnit', '広告の表示枠', 'configured / hidden'),
  molecule('ArticleEngagementTracker', '記事の閲覧イベントを記録', 'active'),
  molecule('BannerAd', 'バナー広告', 'configured / hidden'),
  molecule('BlogTitle', 'サイト名と説明'),
  molecule('Breadcrumb', 'ページの階層表示'),
  molecule('BuyMeACoffee', '支援ページへのリンク'),
  molecule('CodeBlock', 'コード表示とコピー', 'default / copied'),
  molecule('CopyButton', 'テキストのコピー', 'default / copied'),
  molecule('EmptyState', 'データがない理由と次の操作'),
  molecule('MdxBlockquote', '引用文の表示'),
  molecule('MdxHeading', '記事見出しとアンカー', 'h1–h6 / copied'),
  molecule('HeadingAnchor', '見出しURLのコピー', 'default / copied'),
  molecule('MdxImage', '記事内画像'),
  molecule('MdxTable', '横スクロールできる表'),
  molecule('NewsletterForm', 'メール購読フォーム', 'idle / submitting / success / error'),
  molecule('Pagination', 'ページ移動', 'first / middle / last'),
  molecule('ReadingProgress', '記事をどこまで読んだか表示', '0–100%'),
  molecule('ShareButtons', '記事の共有ボタン'),
  molecule('StoreButtons', '配信ストアへのリンク'),
  molecule('TagList', 'タグ一覧'),
  organism('AffiliateRecommend', '記事に関連する商品'),
  organism('ArticleCard', '記事一覧のカード', 'internal / external / hover'),
  organism('ArticleCardSkeleton', '記事カードの読み込み表示', 'loading'),
  organism('ArticlePresentation', '公開記事とプレビューの共通表示'),
  organism('AuthorBio', '著者プロフィール'),
  organism('ContentLinkCard', '内部・外部リンクのカード', 'internal / external / fallback'),
  organism('LinkCardView', 'リンクカードの共通表示', 'image / fallback / compact'),
  organism('Container', 'ページ幅と背景の共通枠', 'sm–6xl'),
  organism('Footer', 'フッターのリンクと権利表示'),
  organism('Header', 'サイト共通のナビゲーション', 'desktop / mobile / active'),
  organism('GiscusComments', '記事末尾のコメント欄', 'loading / ready'),
  organism(
    'PostHeader',
    '記事タイトル、日付、タグ、画像',
    'with image / generated / without image'
  ),
  organism('PostList', '記事カードと広告の一覧', 'populated / empty'),
  organism('ProductLink', '商品情報と購入リンク', 'metadata / fallback'),
  organism('PromoBlock', '記事内の広告とおすすめ'),
  organism('PromoCard', '記事一覧内の広告カード'),
  organism('TableOfContents', '記事の目次', 'desktop / collapsible'),
  organism('TagFilterList', 'タグによる絞り込み', 'selected / unselected'),
  pattern('Writer', '記事執筆の全工程を一つの作業面に統合する', 'edit / preview / saving'),
  pattern('WriterAnalysisPanel', '文章構造とSEO指標を可視化する', 'ready / needs work'),
  pattern(
    'WriterArticlePicker',
    '下書き・公開済み記事を検索して開く',
    'loading / empty / selected'
  ),
  pattern(
    'WriterEditorCanvas',
    '本文入力・貼り付け・ドロップ・校正位置を扱う',
    'editing / dragging'
  ),
  pattern('WriterHeader', '文書切替・表示切替・保存操作をまとめる', 'saved / dirty / saving'),
  pattern('WriterInspector', '校正結果と記事設定を横断表示する', 'open / closed / selected issue'),
  pattern('WriterLinkLibrary', 'ノートと公開記事を検索して本文へ挿入する', 'search / drag'),
  pattern(
    'WriterMetadataSettings',
    '公開日時と検索表示情報を設定する',
    'draft / scheduled / published'
  ),
  pattern('WriterPreview', '公開記事と同一構造で編集内容を確認する', 'desktop / mobile'),
  pattern('WriterPublicationReadiness', '公開前の不足項目を判定する', 'blocked / ready'),
  pattern(
    'WriterReviewPanel',
    '校正指摘から本文位置へ移動し修正する',
    'unchecked / issues / clean'
  ),
  pattern('WriterSidePanelContent', '選択中の執筆支援パネルを表示する', 'five panel modes'),
  pattern('WriterTagPicker', '既存タグ検索と新規タグ追加を行う', 'empty / suggested / selected'),
  pattern(
    'WriterThumbnailSettings',
    '記事サムネイルを選択・生成する',
    'upload / preset / generated'
  ),
  pattern('WriterTools', '書式・画像・校正・構成操作をまとめる', 'open / closed / linting'),
];

export const componentCategories: ComponentCategory[] = [
  'Atoms',
  'Molecules',
  'Organisms',
  'Patterns',
];
