import type { BaseContentMetadata } from './content';

export const filterPostsByTitle = <Post extends BaseContentMetadata>(
  posts: Post[],
  query: string
): Post[] => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return posts;
  }

  const lowerQuery = trimmedQuery.toLowerCase();

  return posts.filter((post) => post.title.toLowerCase().includes(lowerQuery));
};

/**
 * タイトル・タグ・説明・本文プレーンテキストを横断して部分一致検索する。
 * 本文(searchText)は一覧取得時のみ付与されるため、無い場合は対象から外れる。
 */
export const filterPostsByQuery = <Post extends BaseContentMetadata>(
  posts: Post[],
  query: string
): Post[] => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return posts;
  }

  const lowerQuery = trimmedQuery.toLowerCase();

  return posts.filter((post) => {
    const haystack = [
      post.title,
      post.description ?? '',
      post.searchText ?? '',
      ...(post.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(lowerQuery);
  });
};
