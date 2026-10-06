'use client';

import { useMemo } from 'react';
import { siteConfig } from '@/config/site';
import { createObsidianWikiLink, createPublicArticleWikiLink } from '@/lib/local-writer-hints';
import { analyzeWriterDraft, findRelatedWriterArticles } from '@/lib/writer-analysis';
import { createWriterPreflight } from '@/lib/writer-preflight';
import { createAutomaticSeo } from '@/lib/writer-seo';
import { getPublicationMode, getSeoLengthState } from '@/lib/writer-publishing';
import type { WriterLinkItem } from './writer-link-library';
import {
  type ArticleSummary,
  type DraftState,
  type LintMessage,
  type NoteHint,
  parseWriterTags,
} from './writer-model';

interface UseWriterDerivedStateOptions {
  article: DraftState;
  articles: ArticleSummary[];
  currentSlug?: string;
  lastLintedBody?: string;
  lintMessages: LintMessage[];
  noteHints: NoteHint[];
}

const resolvePreviewEyecatch = (article: DraftState, previewSlug?: string) => {
  if (!article.eyecatch?.url.trim()) return undefined;
  return {
    ...article.eyecatch,
    url:
      /^(?:https?:|\/)/u.test(article.eyecatch.url) || !previewSlug
        ? article.eyecatch.url
        : `/blog-assets/${previewSlug}/${article.eyecatch.url.replace(/^\.\//u, '')}`,
  };
};

export const useWriterDerivedState = ({
  article,
  articles,
  currentSlug,
  lastLintedBody,
  lintMessages,
  noteHints,
}: UseWriterDerivedStateOptions) => {
  const today = new Date().toISOString().slice(0, 10);
  const automaticSeo = useMemo(() => createAutomaticSeo(article), [article]);
  const characterCount = useMemo(() => article.body.replace(/\s/g, '').length, [article.body]);
  const previewSlug = currentSlug ?? article.slug;
  const previewEyecatch = useMemo(
    () => resolvePreviewEyecatch(article, previewSlug),
    [article, previewSlug]
  );
  const thumbnailTags = useMemo(() => parseWriterTags(article.tags), [article.tags]);
  const previewMetadata = useMemo(
    () => ({
      canonicalUrl: article.canonicalUrl || undefined,
      characterCount,
      createdAt: article.createdAt,
      description: article.description || undefined,
      draft: article.draft,
      eyecatch: previewEyecatch,
      noindex: article.noindex,
      seoTitle: article.seoTitle || undefined,
      slug: previewSlug || 'preview',
      tags: thumbnailTags,
      title: article.title || '無題の記事',
      updatedAt: article.updatedAt || article.createdAt,
    }),
    [article, characterCount, previewEyecatch, previewSlug, thumbnailTags]
  );
  const writingAnalysis = useMemo(
    () =>
      analyzeWriterDraft(
        article.title,
        article.body,
        articles.map((item) => item.slug)
      ),
    [article.body, article.title, articles]
  );
  const relatedArticles = useMemo(
    () =>
      findRelatedWriterArticles(
        {
          body: article.body,
          currentSlug,
          tags: article.tags,
          title: article.title,
        },
        articles
      ),
    [article.body, article.tags, article.title, articles, currentSlug]
  );
  const publicationChecks = useMemo(
    () => [
      { done: Boolean(article.title.trim()), label: 'タイトル' },
      { done: Boolean(automaticSeo.description), label: '説明' },
      { done: Boolean(article.slug.trim()), label: 'URL' },
      { done: Boolean(article.eyecatch), label: 'サムネイル' },
      { done: Boolean(article.tags.trim()), label: 'タグ' },
      {
        done: lastLintedBody === article.body && lintMessages.length === 0,
        label: '校正',
      },
    ],
    [article, automaticSeo.description, lastLintedBody, lintMessages.length]
  );
  const preflight = useMemo(
    () =>
      createWriterPreflight({
        body: article.body,
        brokenInternalLinks: writingAnalysis.brokenInternalLinks.length,
        eyecatch: Boolean(article.eyecatch),
        lintChecked: lastLintedBody === article.body,
        lintMessages: lintMessages.length,
        slug: article.slug,
        tags: article.tags,
        title: article.title,
      }),
    [article, lastLintedBody, lintMessages.length, writingAnalysis.brokenInternalLinks.length]
  );
  const noteLinkItems = useMemo<WriterLinkItem[]>(
    () =>
      noteHints.map((note) => ({
        description: note.excerpt,
        id: note.target,
        searchText: `${note.title} ${note.target} ${note.excerpt}`,
        targetLabel: note.target,
        title: note.title,
        wikiLink: createObsidianWikiLink(note.target, note.title),
      })),
    [noteHints]
  );
  const publicArticleLinkItems = useMemo<WriterLinkItem[]>(
    () =>
      articles
        .filter((item) => !item.draft && item.slug !== currentSlug)
        .map((item) => ({
          description: item.description,
          id: item.slug,
          searchText: `${item.title} ${item.slug} ${item.description} ${item.tags.join(' ')}`,
          targetLabel: `/blog/${item.slug}`,
          title: item.title,
          wikiLink: createPublicArticleWikiLink(item.slug, item.title),
        })),
    [articles, currentSlug]
  );

  return {
    automaticSeo,
    characterCount,
    descriptionState: getSeoLengthState(automaticSeo.description.length, 70, 160),
    noteLinkItems,
    preflight,
    previewMetadata,
    previewSlug,
    publicationChecks,
    publicationMode: getPublicationMode(article, today),
    publicArticleLinkItems,
    publicUrl: article.canonicalUrl || `${siteConfig.url}/blog/${article.slug || 'article-slug'}`,
    relatedArticles,
    seoTitleState: getSeoLengthState(automaticSeo.seoTitle.length, 30, 60),
    today,
    writingAnalysis,
  };
};
