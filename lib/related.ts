import type { BaseContentMetadata } from '@/lib/content';

/** 2つのタグ集合の Jaccard 類似度 (|共通| / |和集合|) */
const jaccardSimilarity = (a: string[], b: string[]): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const tag of setA) {
    if (setB.has(tag)) {
      intersection += 1;
    }
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
};

/**
 * タグの Jaccard 類似度で関連記事を上位 limit 件返す純関数。
 * - 自分自身は除外
 * - 同点は新しい順(createdAt 降順)で安定ソート
 * - 共通タグがない記事は表示しない
 */
export const getRelatedPosts = (
  current: BaseContentMetadata,
  allPosts: BaseContentMetadata[],
  limit = 3
): BaseContentMetadata[] => {
  const candidates = allPosts.filter((post) => post.slug !== current.slug);
  const currentTags = current.tags ?? [];

  const scored = candidates
    .map((post) => ({ post, score: jaccardSimilarity(currentTags, post.tags ?? []) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.post.createdAt.localeCompare(a.post.createdAt);
    });

  return scored
    .filter((entry) => entry.score > 0)
    .slice(0, limit)
    .map((entry) => entry.post);
};
