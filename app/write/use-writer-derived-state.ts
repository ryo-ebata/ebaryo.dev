'use client';

import { useDeferredValue, useMemo } from 'react';
import { siteConfig } from '@/config/site';
import { createObsidianWikiLink, createPublicArticleWikiLink } from '@/lib/local-writer-hints';
import { analyzeWriterDraft, findRelatedWriterArticles } from '@/lib/writer-analysis';
import { analyzeWriterFacts } from '@/lib/writer-facts';
import { suggestEvidenceForClaims, type WriterEvidenceSource } from '@/lib/writer-evidence';
import { createWriterNextAction } from '@/lib/writer-next-action';
import { createWriterPreflight } from '@/lib/writer-preflight';
import { createAutomaticSeo } from '@/lib/writer-seo';
import { getPublicationMode, getSeoLengthState } from '@/lib/writer-publishing';
import { analyzeWriterVoice, type WriterVoiceProfile } from '@/lib/writer-voice';
import type { WriterLinkItem } from './writer-link-library';
import {
  type ArticleSummary,
  type DraftState,
  type LintMessage,
  type NoteHint,
  type WriterSourceHint,
  parseWriterTags,
} from './writer-model';

interface UseWriterDerivedStateOptions {
  article: DraftState;
  articles: ArticleSummary[];
  currentSlug?: string;
  lastLintedBody?: string;
  lintMessages: LintMessage[];
  clippingHints: WriterSourceHint[];
  kindleHints: WriterSourceHint[];
  noteHints: NoteHint[];
  voiceProfile?: WriterVoiceProfile;
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
  clippingHints,
  kindleHints,
  noteHints,
  voiceProfile,
}: UseWriterDerivedStateOptions) => {
  const today = new Date().toISOString().slice(0, 10);
  const deferredBody = useDeferredValue(article.body);
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
  const factAnalysis = useMemo(
    () => analyzeWriterFacts(article.title, deferredBody),
    [article.title, deferredBody]
  );
  const voiceAnalysis = useMemo(
    () => analyzeWriterVoice(deferredBody, voiceProfile),
    [deferredBody, voiceProfile]
  );
  const relatedArticles = useMemo(
    () =>
      findRelatedWriterArticles(
        {
          body: deferredBody,
          currentSlug,
          tags: article.tags,
          title: article.title,
        },
        articles
      ),
    [article.tags, article.title, articles, currentSlug, deferredBody]
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
      {
        done:
          writingAnalysis.readerExperience.blockers.length === 0 &&
          writingAnalysis.readerExperience.warnings.length === 0,
        label: '読者理解',
      },
    ],
    [article, automaticSeo.description, lastLintedBody, lintMessages.length, writingAnalysis]
  );
  const preflight = useMemo(
    () =>
      createWriterPreflight({
        body: article.body,
        brokenInternalLinks: writingAnalysis.brokenInternalLinks.length,
        eyecatch: Boolean(article.eyecatch),
        lintChecked: lastLintedBody === article.body,
        lintMessages: lintMessages.length,
        readerBlockers: writingAnalysis.readerExperience.blockers.length,
        readerWarnings: writingAnalysis.readerExperience.warnings.length,
        slug: article.slug,
        tags: article.tags,
        title: article.title,
      }),
    [article, lastLintedBody, lintMessages.length, writingAnalysis]
  );
  const noteLinkItems = useMemo<WriterLinkItem[]>(
    () =>
      noteHints.map((note) => ({
        badge: 'Note',
        description: note.excerpt,
        id: note.target,
        searchText: `${note.title} ${note.target} ${note.excerpt}`,
        targetLabel: note.target,
        title: note.title,
        insertText: createObsidianWikiLink(note.target, note.title),
      })),
    [noteHints]
  );
  const toSourceLinkItems = (hints: WriterSourceHint[], badge: string): WriterLinkItem[] =>
    hints.map((hint) => ({
      badge,
      description: hint.description,
      id: hint.insertText,
      insertText: hint.insertText,
      searchText: `${hint.title} ${hint.description} ${hint.targetLabel}`,
      targetLabel: hint.targetLabel,
      title: hint.title,
    }));
  const clippingLinkItems = useMemo(
    () => toSourceLinkItems(clippingHints, 'Clip'),
    [clippingHints]
  );
  const kindleLinkItems = useMemo(() => toSourceLinkItems(kindleHints, 'Kindle'), [kindleHints]);
  const publicArticleLinkItems = useMemo<WriterLinkItem[]>(
    () =>
      articles
        .filter((item) => !item.draft && item.slug !== currentSlug)
        .map((item) => ({
          badge: 'Article',
          description: item.description,
          id: item.slug,
          searchText: `${item.title} ${item.slug} ${item.description} ${item.tags.join(' ')}`,
          targetLabel: `/blog/${item.slug}`,
          title: item.title,
          insertText: createPublicArticleWikiLink(item.slug, item.title),
        })),
    [articles, currentSlug]
  );
  const evidenceSources = useMemo<WriterEvidenceSource[]>(
    () => [
      ...noteLinkItems.map((item) => ({
        description: item.description ?? '',
        id: item.id,
        insertText: item.insertText,
        sourceType: 'note' as const,
        title: item.title,
      })),
      ...clippingLinkItems.map((item) => ({
        description: item.description ?? '',
        id: item.id,
        insertText: item.insertText,
        sourceType: 'clipping' as const,
        title: item.title,
      })),
      ...kindleLinkItems.map((item) => ({
        description: item.description ?? '',
        id: item.id,
        insertText: item.insertText,
        sourceType: 'kindle' as const,
        title: item.title,
      })),
      ...publicArticleLinkItems.map((item) => ({
        description: item.description ?? '',
        id: item.id,
        insertText: item.insertText,
        sourceType: 'article' as const,
        title: item.title,
      })),
    ],
    [clippingLinkItems, kindleLinkItems, noteLinkItems, publicArticleLinkItems]
  );
  const evidenceSuggestions = useMemo(
    () => suggestEvidenceForClaims(factAnalysis.claims, evidenceSources),
    [evidenceSources, factAnalysis.claims]
  );
  const nextAction = useMemo(
    () =>
      createWriterNextAction({
        analysis: writingAnalysis,
        facts: factAnalysis,
        lintCount: lintMessages.length,
        title: article.title,
        voice: voiceAnalysis,
      }),
    [article.title, factAnalysis, lintMessages.length, voiceAnalysis, writingAnalysis]
  );

  return {
    automaticSeo,
    characterCount,
    clippingLinkItems,
    descriptionState: getSeoLengthState(automaticSeo.description.length, 70, 160),
    evidenceSuggestions,
    factAnalysis,
    kindleLinkItems,
    nextAction,
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
    voiceAnalysis,
    writingAnalysis,
  };
};
