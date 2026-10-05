import { z } from 'zod';
import type { BaseContentMetadata } from '@/lib/content';
import { resolveAssetUrl } from './paths';

/* gray-matterはYAMLの無クォート日付(2026-08-07)をDateオブジェクトに自動変換するため、
   string/Date両方を受理してISO文字列へ正規化する */
const dateLikeSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value.toISOString() : value));

const eyecatchFrontmatterSchema = z.object({
  alt: z.string().optional(),
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const frontmatterSchema = z.object({
  canonicalUrl: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  createdAt: dateLikeSchema,
  updatedAt: dateLikeSchema,
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
  eyecatch: eyecatchFrontmatterSchema.optional(),
  noindex: z.boolean().optional(),
  seoTitle: z.string().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export interface BlogArticleData {
  contentMarkdown: string;
  metadata: BaseContentMetadata;
}

/* ルート相対URLのまま返す(絶対URL化はnext/imageのremotePatterns制約に抵触するため
   行わない。OGP/JSON-LD/sitemap等で絶対URLが要る箇所はlib/metadata.tsのtoAbsoluteUrlが担う) */
const resolveEyecatchUrl = (
  slug: string,
  eyecatch?: Frontmatter['eyecatch']
): BaseContentMetadata['eyecatch'] => {
  if (!eyecatch) {
    return undefined;
  }
  return { ...eyecatch, url: resolveAssetUrl(slug, eyecatch.url) };
};

export const toBaseContentMetadata = (
  slug: string,
  frontmatter: Frontmatter,
  characterCount?: number
): BaseContentMetadata => ({
  canonicalUrl: frontmatter.canonicalUrl,
  characterCount,
  createdAt: frontmatter.createdAt,
  description: frontmatter.description,
  draft: frontmatter.draft,
  eyecatch: resolveEyecatchUrl(slug, frontmatter.eyecatch),
  noindex: frontmatter.noindex,
  slug,
  seoTitle: frontmatter.seoTitle,
  tags: frontmatter.tags,
  title: frontmatter.title,
  updatedAt: frontmatter.updatedAt,
});
