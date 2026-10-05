import matter from 'gray-matter';
import { z } from 'zod';
import { normalizeWriterMarkdown } from './writer-markdown';
import { createAutomaticSeo } from './writer-seo';

export const localArticleSchema = z.object({
  body: z.string().min(1, '本文を入力してください'),
  canonicalUrl: z.union([z.literal(''), z.url('canonical URLを確認してください')]).optional(),
  createdAt: z.iso.date(),
  description: z.string().trim().max(240).optional(),
  draft: z.boolean(),
  eyecatch: z
    .object({
      alt: z.string().trim().max(160).optional(),
      height: z.number().positive().optional(),
      url: z.string().min(1),
      width: z.number().positive().optional(),
    })
    .nullable()
    .optional(),
  noindex: z.boolean().optional(),
  seoTitle: z.string().trim().max(60, 'SEOタイトルは60文字以内にしてください').optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'スラッグを入力してください')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'スラッグは英小文字・数字・ハイフンで入力してください'),
  tags: z.array(z.string().trim().min(1)).max(12),
  title: z.string().trim().min(1, 'タイトルを入力してください'),
});

export type LocalArticleInput = z.infer<typeof localArticleSchema>;

export const serializeLocalArticle = (
  input: LocalArticleInput,
  now: Date,
  existingData: Record<string, unknown> = {}
): string => {
  const timestamp = now.toISOString();
  const {
    canonicalUrl: _existingCanonicalUrl,
    eyecatch: existingEyecatch,
    noindex: _existingNoindex,
    seoTitle: _existingSeoTitle,
    ...preservedData
  } = existingData;
  const parsedExistingEyecatch = localArticleSchema.shape.eyecatch.safeParse(existingEyecatch);
  const eyecatch =
    input.eyecatch === undefined
      ? parsedExistingEyecatch.success
        ? parsedExistingEyecatch.data
        : undefined
      : input.eyecatch;
  const automaticSeo = createAutomaticSeo({ ...input, eyecatch });
  return matter.stringify(`${normalizeWriterMarkdown(input.body).trim()}\n`, {
    ...preservedData,
    title: input.title,
    ...(automaticSeo.seoTitle ? { seoTitle: automaticSeo.seoTitle } : {}),
    ...(input.canonicalUrl ? { canonicalUrl: input.canonicalUrl } : {}),
    ...(automaticSeo.description ? { description: automaticSeo.description } : {}),
    createdAt: new Date(`${input.createdAt}T00:00:00.000Z`).toISOString(),
    updatedAt: timestamp,
    ...(input.tags.length > 0 ? { tags: input.tags } : {}),
    draft: input.draft,
    ...(input.noindex ? { noindex: true } : {}),
    ...(automaticSeo.eyecatch ? { eyecatch: automaticSeo.eyecatch } : {}),
  });
};
