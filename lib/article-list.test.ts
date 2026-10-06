import { describe, expect, it } from 'vitest';
import type { ArticleListItem } from './content';
import type { ExternalArticleItem } from './external-thumbnail';
import { sortArticlesByCreatedAt, toExternalArticleListItem } from './article-list';

const createArticle = (slug: string, createdAt: string): ArticleListItem => ({
  createdAt,
  slug,
  title: slug,
  updatedAt: createdAt,
});

describe('sortArticlesByCreatedAt', () => {
  it('内部・外部の区別なくcreatedAtの降順に並べる', () => {
    const articles = [
      createArticle('internal-old', '2024-01-01T00:00:00Z'),
      { ...createArticle('external-latest', '2025-03-01T00:00:00Z'), isExternal: true },
      createArticle('internal-middle', '2025-02-01T00:00:00Z'),
    ];

    expect(sortArticlesByCreatedAt(articles).map((article) => article.slug)).toEqual([
      'external-latest',
      'internal-middle',
      'internal-old',
    ]);
  });

  it('入力配列を変更しない', () => {
    const articles = [
      createArticle('old', '2024-01-01T00:00:00Z'),
      createArticle('new', '2025-01-01T00:00:00Z'),
    ];

    sortArticlesByCreatedAt(articles);

    expect(articles.map((article) => article.slug)).toEqual(['old', 'new']);
  });
});

describe('toExternalArticleListItem', () => {
  it.each([
    ['zenn', 'zenn'],
    ['qiita', 'qiita'],
  ] as const)('%s記事へ媒体タグを付ける', (type, expectedTag) => {
    const article =
      type === 'zenn'
        ? {
            type,
            article: {
              body_updated_at: '2025-01-02T00:00:00Z',
              id: 1,
              path: '/example/article',
              post_type: 'Article',
              published_at: '2025-01-01T00:00:00Z',
              title: 'Zenn記事',
            },
          }
        : {
            type,
            article: {
              body: '本文',
              created_at: '2025-01-01T00:00:00Z',
              id: 'item-1',
              tags: [{ name: 'TypeScript', versions: [] }],
              title: 'Qiita記事',
              updated_at: '2025-01-02T00:00:00Z',
              url: 'https://qiita.com/example/items/item-1',
            },
          };

    const result = toExternalArticleListItem(article as ExternalArticleItem);

    expect(result.tags).toContain(expectedTag);
  });
});
