import { type ReactNode, Suspense } from 'react';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Root } from 'hast';

import { cn } from '@/lib/utils';
import type { LinkCardKind } from '@/lib/link-card';

import { CodeBlock } from '@/components/molecules/code-block';
import { MdxBlockquote } from '@/components/molecules/mdx-blockquote';
import { MdxH1, MdxH2, MdxH3, MdxH4, MdxH5, MdxH6 } from '@/components/molecules/mdx-heading';
import { MdxImage } from '@/components/molecules/mdx-image';
import { MdxTable } from '@/components/molecules/mdx-table';
import { ContentLinkCard as ContentLinkCardAsync } from '@/components/organisms/content-link-card/content-link-card';
import { ProductLink } from '@/components/organisms/product-link/product-link';

import { rehypeLinkCard } from './rehype-link-card';
import { createMarkdownToHastProcessor } from './markdown-pipeline';
import { applyContentCacheLife } from './cache-policy';
import { extractToc, type TocItem } from './extract-toc';

const ContentLinkCardLoading = ({ kind, url }: { kind: LinkCardKind; url: string }) => {
  const shortUrl = kind === 'internal' ? url : new URL(url).hostname;
  return (
    <div
      className={cn(
        'not-prose flex w-full animate-pulse items-center gap-3 overflow-hidden rounded-xl bg-card p-4 text-card-foreground shadow-xs ring-1 ring-foreground/10'
      )}
    >
      <span>🔗</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{shortUrl}</p>
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    </div>
  );
};

const ContentLinkCard = ({
  kind,
  label,
  url,
}: {
  kind: LinkCardKind;
  label: string;
  url: string;
}) => (
  <Suspense fallback={<ContentLinkCardLoading kind={kind} url={url} />}>
    <ContentLinkCardAsync kind={kind} label={label} url={url} />
  </Suspense>
);

const components = {
  'link-card': ContentLinkCard,
  'product-link': ProductLink,
  'code-block': CodeBlock,
  blockquote: MdxBlockquote,
  h1: MdxH1,
  h2: MdxH2,
  h3: MdxH3,
  h4: MdxH4,
  h5: MdxH5,
  h6: MdxH6,
  img: MdxImage,
  table: MdxTable,
};

export interface RenderedMarkdownContent {
  content: ReactNode;
  toc: TocItem[];
}

/**
 * MarkdownをReact要素とTOCへ1回のパースで変換する。
 * 同じhastからTOCも抽出するため、別途Markdownを再パースする必要がない。
 */
export const renderMarkdownContent = async (
  markdown: string,
  slug: string
): Promise<RenderedMarkdownContent> => {
  'use cache';
  applyContentCacheLife();

  const processor = createMarkdownToHastProcessor(slug).use(rehypeLinkCard);

  const mdast = processor.parse(markdown);
  const hast = (await processor.run(mdast)) as Root;

  const toc = extractToc(hast);

  const content = toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components,
  });

  return { content, toc };
};
