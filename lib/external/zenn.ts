'use server';

import 'server-only';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/* 定数 */
const REVALIDATE_SECONDS = 3600;

const zennUserSchema = z.object({
  avatar_small_url: z.string(),
  id: z.number(),
  name: z.string(),
  username: z.string(),
});

const zennPublicationSchema = z.object({
  avatar_registered: z.boolean(),
  avatar_small_url: z.string(),
  avatar_url: z.string(),
  display_name: z.string(),
  id: z.number(),
  name: z.string(),
  pro: z.boolean(),
});

const zennArticleSchema = z.object({
  article_type: z.string(),
  body_letters_count: z.number(),
  body_updated_at: z.string(),
  bookmarked_count: z.number(),
  comments_count: z.number(),
  emoji: z.string(),
  id: z.number(),
  is_suspending_private: z.boolean(),
  liked_count: z.number(),
  path: z.string(),
  post_type: z.string(),
  principal_type: z.string(),
  publication: zennPublicationSchema,
  publication_article_override: z.unknown().nullable(),
  published_at: z.string(),
  slug: z.string(),
  source_repo_updated_at: z.string().nullable(),
  title: z.string(),
  user: zennUserSchema,
});

const zennArticlesResponseSchema = z.object({
  articles: z.array(zennArticleSchema),
  next_page: z.number().nullable(),
  total_count: z.number().nullable(),
});

export type ZennUser = z.infer<typeof zennUserSchema>;
export type ZennPublication = z.infer<typeof zennPublicationSchema>;
export type ZennArticle = z.infer<typeof zennArticleSchema>;
export type ZennArticlesResponse = z.infer<typeof zennArticlesResponseSchema>;

const createEmptyResponse = (): ZennArticlesResponse => ({
  articles: [],
  next_page: null,
  total_count: null,
});

export const getZennArticles = async (): Promise<ZennArticlesResponse> => {
  try {
    const response = await fetch('https://zenn.dev/api/articles?username=ebarinyo', {
      next: {
        /* 1時間ごとに再検証 */
        revalidate: REVALIDATE_SECONDS,
        tags: ['zenn-articles'],
      },
    });

    if (!response.ok) {
      throw new Error(`Zenn API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return zennArticlesResponseSchema.parse(data);
  } catch (error) {
    logger.error('Zenn記事の取得に失敗しました', { source: 'zenn' }, error);
    return createEmptyResponse();
  }
};
