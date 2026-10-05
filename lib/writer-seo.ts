import { createNoteExcerpt } from './local-writer-hints';

interface SeoSource {
  body: string;
  description?: string;
  eyecatch?: { alt?: string; height?: number; url: string; width?: number } | null;
  seoTitle?: string;
  title: string;
}

export const createAutomaticSeo = (source: SeoSource) => {
  const title = source.title.trim();
  const seoTitle = source.seoTitle?.trim() || title.slice(0, 60);
  const description = source.description?.trim() || createNoteExcerpt(source.body, 120);
  const eyecatch = source.eyecatch
    ? {
        ...source.eyecatch,
        alt:
          source.eyecatch.alt?.trim() ||
          (title ? `${title}のサムネイル画像` : '記事のサムネイル画像'),
      }
    : source.eyecatch;

  return { description, eyecatch, seoTitle };
};
