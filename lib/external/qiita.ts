'use server';

import 'server-only';
import { envConfig } from '@/config/env';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const qiitaTagSchema = z.object({
  name: z.string(),
  versions: z.array(z.unknown()),
});

const qiitaUserSchema = z.object({
  description: z.string(),
  facebook_id: z.string(),
  followees_count: z.number(),
  followers_count: z.number(),
  github_login_name: z.string().nullable(),
  id: z.string(),
  items_count: z.number(),
  linkedin_id: z.string(),
  location: z.string(),
  name: z.string(),
  organization: z.string(),
  permanent_id: z.number(),
  profile_image_url: z.string(),
  team_only: z.boolean(),
  twitter_screen_name: z.string(),
  website_url: z.string(),
});

const qiitaArticleSchema = z.object({
  body: z.string(),
  coediting: z.boolean(),
  comments_count: z.number(),
  created_at: z.string(),
  group: z.unknown().nullable(),
  id: z.string(),
  likes_count: z.number(),
  organization_url_name: z.string(),
  page_views_count: z.number(),
  private: z.boolean(),
  reactions_count: z.number(),
  rendered_body: z.string(),
  slide: z.boolean(),
  stocks_count: z.number(),
  tags: z.array(qiitaTagSchema),
  team_membership: z.unknown().nullable(),
  title: z.string(),
  updated_at: z.string(),
  url: z.string(),
  user: qiitaUserSchema,
});

const qiitaArticlesResponseSchema = z.array(qiitaArticleSchema);

export type QiitaTag = z.infer<typeof qiitaTagSchema>;
export type QiitaUser = z.infer<typeof qiitaUserSchema>;
export type QiitaArticle = z.infer<typeof qiitaArticleSchema>;
export type QiitaArticlesResponse = z.infer<typeof qiitaArticlesResponseSchema>;

/**
 * Qiitaの記事を取得
 */
const REVALIDATE_INTERVAL_SECONDS = 3600;

export const getQiitaArticles = async (): Promise<QiitaArticlesResponse> => {
  if (!envConfig.qiita.QIITA_API_ACCESS_TOKEN) {
    return [];
  }

  try {
    const response = await fetch(`${envConfig.qiita.QIITA_API_URL}/authenticated_user/items`, {
      headers: {
        Authorization: `Bearer ${envConfig.qiita.QIITA_API_ACCESS_TOKEN}`,
      },
      next: {
        revalidate: REVALIDATE_INTERVAL_SECONDS,
        tags: ['qiita-articles'],
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Qiita API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return qiitaArticlesResponseSchema.parse(data);
  } catch (error) {
    logger.error('Qiita記事の取得に失敗しました', { source: 'qiita' }, error);
    return [];
  }
};
