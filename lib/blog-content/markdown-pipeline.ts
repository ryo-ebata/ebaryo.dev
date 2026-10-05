import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { remarkResolveImages } from './remark-resolve-images';
import { remarkResolveWikiLinks } from './remark-resolve-wiki-links';
import { rehypeCodeBlock } from './rehype-code-block';
import { rehypePlaygroundEmbed } from './rehype-playground-embed';

/**
 * Markdown→hast変換の共通パイプライン。content-rendererとextract-tocで共有することで、
 * 両者が同じrehype-slugを通ることを保証し、本文中の見出しアンカーとTOCのidを一致させる。
 */
export const createMarkdownToHastProcessor = (slug: string) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkResolveWikiLinks, { slug })
    .use(remarkResolveImages, { slug })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypePlaygroundEmbed)
    .use(rehypeCodeBlock);
