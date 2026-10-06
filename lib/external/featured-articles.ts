import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { ExternalArticleItem } from '@/lib/external-thumbnail';
import { getQiitaArticles } from './qiita';
import { getZennArticles } from './zenn';

const MAX_EXTERNAL_ARTICLES = 5;

const getExternalArticles = async () => {
  const [zennResponse, qiitaArticles] = await Promise.all([getZennArticles(), getQiitaArticles()]);

  return [
    ...zennResponse.articles.map((article) => ({
      article,
      likesCount: article.liked_count,
      type: 'zenn' as const,
    })),
    ...qiitaArticles.map((article) => ({
      article,
      likesCount: article.likes_count,
      type: 'qiita' as const,
    })),
  ];
};

export const getAllExternalArticles = async (): Promise<ExternalArticleItem[]> => {
  'use cache';
  cacheLife('hours');
  cacheTag('zenn-articles');
  cacheTag('qiita-articles');

  const articles = await getExternalArticles();

  return articles
    .map(({ article, type }) => ({ article, type }) as ExternalArticleItem)
    .sort((first, second) => {
      const firstDate =
        first.type === 'zenn' ? first.article.published_at : first.article.created_at;
      const secondDate =
        second.type === 'zenn' ? second.article.published_at : second.article.created_at;
      return Date.parse(secondDate) - Date.parse(firstDate);
    });
};

export const getFeaturedExternalArticles = async (): Promise<ExternalArticleItem[]> => {
  'use cache';
  cacheLife('hours');
  cacheTag('zenn-articles');
  cacheTag('qiita-articles');

  const articles = await getExternalArticles();

  return articles
    .sort((first, second) => second.likesCount - first.likesCount)
    .slice(0, MAX_EXTERNAL_ARTICLES)
    .map(({ article, type }) => ({ article, type }) as ExternalArticleItem);
};
