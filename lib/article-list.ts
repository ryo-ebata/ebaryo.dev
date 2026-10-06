import type { ArticleListItem } from './content';
import { createExternalThumbnailPath, type ExternalArticleItem } from './external-thumbnail';

const toZennListItem = (item: Extract<ExternalArticleItem, { type: 'zenn' }>): ArticleListItem => ({
  createdAt: item.article.published_at,
  eyecatch: { url: createExternalThumbnailPath('zenn', item.article.id) },
  href: `https://zenn.dev${item.article.path}`,
  isExternal: true,
  slug: `zenn-${item.article.id}`,
  tags: ['zenn', item.article.post_type],
  title: item.article.title,
  updatedAt: item.article.body_updated_at,
});

const toQiitaListItem = (
  item: Extract<ExternalArticleItem, { type: 'qiita' }>
): ArticleListItem => ({
  createdAt: item.article.created_at,
  eyecatch: { url: createExternalThumbnailPath('qiita', item.article.id) },
  href: item.article.url,
  isExternal: true,
  searchText: item.article.body,
  slug: `qiita-${item.article.id}`,
  tags: ['qiita', ...item.article.tags.map((tag) => tag.name)],
  title: item.article.title,
  updatedAt: item.article.updated_at,
});

export const toExternalArticleListItem = (item: ExternalArticleItem): ArticleListItem =>
  item.type === 'zenn' ? toZennListItem(item) : toQiitaListItem(item);

export const sortArticlesByCreatedAt = (articles: ArticleListItem[]): ArticleListItem[] =>
  [...articles].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
