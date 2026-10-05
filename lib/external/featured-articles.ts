import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { ExternalArticleItem } from '@/lib/external-thumbnail';
import { getQiitaArticles } from './qiita';
import { getZennArticles } from './zenn';

const MAX_EXTERNAL_ARTICLES = 5;

export const getFeaturedExternalArticles = async (): Promise<ExternalArticleItem[]> => {
  'use cache';
  cacheLife('hours');
  cacheTag('zenn-articles');
  cacheTag('qiita-articles');

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
  ]
    .sort((first, second) => second.likesCount - first.likesCount)
    .slice(0, MAX_EXTERNAL_ARTICLES)
    .map(({ article, type }) => ({ article, type }) as ExternalArticleItem);
};
