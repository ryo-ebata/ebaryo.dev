export const CACHE_REVALIDATE_SECONDS = {
  content: process.env.NODE_ENV === 'development' ? 5 : 3600,
  externalArticles: 3600,
  linkPreview: 86_400,
} as const;

export const CACHE_TAGS = {
  posts: 'posts',
  qiitaArticles: 'qiita-articles',
  zennArticles: 'zenn-articles',
} as const;
