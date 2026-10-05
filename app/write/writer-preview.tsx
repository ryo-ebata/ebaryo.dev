'use client';

import { Children, isValidElement, type ReactNode, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { BaseContentMetadata } from '@/lib/content';
import { classifyLinkCardUrl, type LinkCardMetadata, type LinkCardTarget } from '@/lib/link-card';
import { getHighlighter } from '@/lib/shiki/highlighter';
import { ArticlePresentation } from '@/components/organisms/article-presentation/article-presentation';
import { LinkCardView } from '@/components/organisms/content-link-card/link-card-view';
import { MdxBlockquote } from '@/components/molecules/mdx-blockquote';
import { MdxH1, MdxH2, MdxH3, MdxH4, MdxH5, MdxH6 } from '@/components/molecules/mdx-heading';
import { MdxTable } from '@/components/molecules/mdx-table';
import styles from './writer.module.css';

function ShikiPreview({ code, language }: { code: string; language: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let active = true;
    void getHighlighter()
      .then((highlighter) => {
        const lang = highlighter.getLoadedLanguages().includes(language) ? language : 'plaintext';
        const highlighted = highlighter.codeToHtml(code.replace(/\n$/u, ''), {
          defaultColor: false,
          lang,
          themes: { dark: 'github-dark', light: 'github-light' },
        });
        if (active) setHtml(highlighted);
      })
      .catch(() => {
        if (active) setHtml('');
      });
    return () => {
      active = false;
    };
  }, [code, language]);

  if (!html)
    return (
      <pre className={styles.codeLoading}>
        <code>{code}</code>
      </pre>
    );
  return <div className={styles.shikiPreview} dangerouslySetInnerHTML={{ __html: html }} />;
}

const linkPreviewRequests = new Map<string, Promise<LinkCardMetadata | null>>();

const loadLinkPreview = (target: LinkCardTarget) => {
  const cached = linkPreviewRequests.get(target.href);
  if (cached) return cached;
  const request = fetch('/api/local-writer/link-preview', {
    body: JSON.stringify({ url: target.href }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const result = (await response.json()) as { metadata?: LinkCardMetadata | null };
      return result.metadata ?? null;
    })
    .catch(() => null);
  linkPreviewRequests.set(target.href, request);
  return request;
};

const WriterLinkCard = ({ label, target }: { label: string; target: LinkCardTarget }) => {
  const [metadata, setMetadata] = useState<LinkCardMetadata | null>(null);

  useEffect(() => {
    let active = true;
    void loadLinkPreview(target).then((result) => {
      if (active) setMetadata(result);
    });
    return () => {
      active = false;
    };
  }, [target.href, target.kind]);

  return (
    <LinkCardView
      description={metadata?.description}
      image={metadata?.image}
      kind={target.kind}
      siteName={metadata?.siteName ?? target.display}
      title={metadata?.title || label || target.display}
      url={target.href}
    />
  );
};

const renderPreviewParagraph = (children: ReactNode) => {
  const items = Children.toArray(children).filter(
    (child) => typeof child !== 'string' || child.trim().length > 0
  );
  const child = items[0];
  if (items.length === 1 && isValidElement<{ children?: ReactNode; href?: string }>(child)) {
    const href = child.props.href ?? '';
    const target = classifyLinkCardUrl(href);
    if (target) {
      const rawLabel = Children.toArray(child.props.children).join('').trim();
      const label = rawLabel === href ? target.display : rawLabel;
      return <WriterLinkCard label={label} target={target} />;
    }
  }
  return <p>{children}</p>;
};

interface WriterPreviewProps {
  body: string;
  metadata: BaseContentMetadata;
  slug?: string;
}

export const WriterPreview = ({ body, metadata, slug }: WriterPreviewProps) => (
  <ArticlePresentation metadata={metadata}>
    <ReactMarkdown
      components={{
        a: ({ children, href }) => (
          <a href={href} rel="noreferrer" target="_blank">
            {children}
          </a>
        ),
        blockquote: ({ children }) => <MdxBlockquote>{children}</MdxBlockquote>,
        code: ({ children, className }) => {
          const language = className?.match(/language-([\w-]+)/u)?.[1];
          if (!language) return <code>{children}</code>;
          return <ShikiPreview code={String(children)} language={language} />;
        },
        h1: ({ children, id }) => <MdxH1 id={id}>{children}</MdxH1>,
        h2: ({ children, id }) => <MdxH2 id={id}>{children}</MdxH2>,
        h3: ({ children, id }) => <MdxH3 id={id}>{children}</MdxH3>,
        h4: ({ children, id }) => <MdxH4 id={id}>{children}</MdxH4>,
        h5: ({ children, id }) => <MdxH5 id={id}>{children}</MdxH5>,
        h6: ({ children, id }) => <MdxH6 id={id}>{children}</MdxH6>,
        img: ({ alt, src }) => {
          const imageSrc = typeof src === 'string' ? src : '';
          const resolvedSrc =
            !imageSrc || /^(?:https?:|\/|data:)/u.test(imageSrc) || !slug
              ? imageSrc
              : `/blog-assets/${slug}/${imageSrc.replace(/^\.\//u, '')}`;
          return <img alt={alt ?? ''} loading="lazy" src={resolvedSrc} />;
        },
        p: ({ children }) => renderPreviewParagraph(children),
        pre: ({ children }) => <>{children}</>,
        table: MdxTable,
      }}
      remarkPlugins={[remarkGfm]}
    >
      {body}
    </ReactMarkdown>
  </ArticlePresentation>
);
