/**
 * 日付から時刻を除去して日付のみを取得する
 */
const getDateOnly = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * 投稿が未来日付（予約投稿）かどうかをチェック
 */
export const isFuturePost = (
  createdAt: string,
  updatedAt: string,
  today: Date = new Date()
): boolean => {
  const todayDateOnly = getDateOnly(today);
  const createdDateOnly = getDateOnly(new Date(createdAt));
  const updatedDateOnly = getDateOnly(new Date(updatedAt));
  return createdDateOnly > todayDateOnly || updatedDateOnly > todayDateOnly;
};

/**
 * 共通のコンテンツメタデータ型
 */
export interface BaseContentMetadata {
  canonicalUrl?: string;
  characterCount?: number;
  createdAt: string;
  description?: string;
  draft?: boolean;
  eyecatch?: { alt?: string; url: string; height?: number; width?: number };
  noindex?: boolean;
  /** 検索用の本文プレーンテキスト(一覧取得時のみ付与)。 */
  searchText?: string;
  slug: string;
  seoTitle?: string;
  tags?: string[];
  title: string;
  updatedAt: string;
}
