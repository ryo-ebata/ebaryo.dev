import 'server-only';
import { unstable_cache } from 'next/cache';
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from '@/lib/cache-policy';
import type { ExternalArticleItem } from '@/lib/external-thumbnail';
import { getQiitaArticles } from './qiita';
import { getZennArticles } from './zenn';

const MAX_EXTERNAL_ARTICLES = 5;

type RankedExternalArticle = ExternalArticleItem & { likesCount: number };

const getExternalArticles = async (): Promise<RankedExternalArticle[]> => {
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

const getPublishedAt = (item: ExternalArticleItem): string =>
  item.type === 'zenn' ? item.article.published_at : item.article.created_at;

const withoutRanking = (item: RankedExternalArticle): ExternalArticleItem => {
  if (item.type === 'zenn') return { article: item.article, type: item.type };
  return { article: item.article, type: item.type };
};

const loadAllExternalArticles = async (): Promise<ExternalArticleItem[]> => {
  const articles = await getExternalArticles();

  return articles
    .map(withoutRanking)
    .sort(
      (first, second) => Date.parse(getPublishedAt(second)) - Date.parse(getPublishedAt(first))
    );
};

const loadFeaturedExternalArticles = async (): Promise<ExternalArticleItem[]> => {
  const articles = await getExternalArticles();

  return articles
    .sort((first, second) => second.likesCount - first.likesCount)
    .slice(0, MAX_EXTERNAL_ARTICLES)
    .map(withoutRanking);
};

const externalArticleCache = {
  revalidate: CACHE_REVALIDATE_SECONDS.externalArticles,
  tags: [CACHE_TAGS.zennArticles, CACHE_TAGS.qiitaArticles],
};

export const getAllExternalArticles = unstable_cache(
  loadAllExternalArticles,
  ['all-external-articles'],
  externalArticleCache
);

export const getFeaturedExternalArticles = unstable_cache(
  loadFeaturedExternalArticles,
  ['featured-external-articles'],
  externalArticleCache
);
