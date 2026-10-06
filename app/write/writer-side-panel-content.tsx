'use client';

import type { findRelatedWriterArticles, WriterAnalysis } from '@/lib/writer-analysis';
import type { createAutomaticSeo } from '@/lib/writer-seo';
import type { createWriterPreflight } from '@/lib/writer-preflight';
import type { getSeoLengthState, PublicationMode } from '@/lib/writer-publishing';
import type { MarkdownEdit } from '@/lib/writer-editing';
import { WriterAnalysisPanel } from './writer-analysis-panel';
import { WriterLinkLibrary, type WriterLinkItem } from './writer-link-library';
import { WriterMetadataSettings } from './writer-metadata-settings';
import type {
  ArticleSummary,
  DraftState,
  LintMessage,
  SidePanel,
  WritingStage,
} from './writer-model';
import { WriterPublicationReadiness } from './writer-publication-readiness';
import { WriterReviewPanel } from './writer-review-panel';
import { WriterThumbnailSettings } from './writer-thumbnail-settings';

interface WriterSidePanelContentProps {
  analysis: WriterAnalysis;
  article: DraftState;
  articles: ArticleSummary[];
  automaticSeo: ReturnType<typeof createAutomaticSeo>;
  currentSlug?: string;
  descriptionState: ReturnType<typeof getSeoLengthState>;
  hasLoadedHints: boolean;
  isGeneratingThumbnail: boolean;
  isLinting: boolean;
  isLoadingHints: boolean;
  lintMessages: LintMessage[];
  noteLinkItems: WriterLinkItem[];
  onApplyAutomaticSeo: () => void;
  onApplyLintEdit: (edit: MarkdownEdit, dismissedIndex?: number) => void;
  onChangePublicationMode: (mode: PublicationMode) => void;
  onChangeStage: (stage: WritingStage) => void;
  onDragStateChange: (dragging: boolean) => void;
  onGenerateThumbnail: Parameters<typeof WriterThumbnailSettings>[0]['onGenerate'];
  onInsertBlock: Parameters<typeof WriterAnalysisPanel>[0]['onInsertBlock'];
  onInsertLink: (wikiLink: string, kind: 'article' | 'note') => void;
  onInsertRelatedArticle: Parameters<typeof WriterAnalysisPanel>[0]['onInsertRelatedArticle'];
  onJump: (offset: number) => void;
  onJumpToLintMessage: (index: number) => void;
  onRunLint: () => void;
  onTagLimit: () => void;
  onUpdate: <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => void;
  onUploadEyecatch: (file: File) => Promise<void> | void;
  panel: SidePanel;
  preflight: ReturnType<typeof createWriterPreflight>;
  publicationChecks: Array<{ done: boolean; label: string }>;
  publicationMode: PublicationMode;
  publicArticleLinkItems: WriterLinkItem[];
  publicUrl: string;
  relatedArticles: ReturnType<typeof findRelatedWriterArticles>;
  seoTitleState: ReturnType<typeof getSeoLengthState>;
  stage: WritingStage;
  today: string;
}

export const WriterSidePanelContent = ({
  analysis,
  article,
  articles,
  automaticSeo,
  currentSlug,
  descriptionState,
  hasLoadedHints,
  isGeneratingThumbnail,
  isLinting,
  isLoadingHints,
  lintMessages,
  noteLinkItems,
  onApplyAutomaticSeo,
  onApplyLintEdit,
  onChangePublicationMode,
  onChangeStage,
  onDragStateChange,
  onGenerateThumbnail,
  onInsertBlock,
  onInsertLink,
  onInsertRelatedArticle,
  onJump,
  onJumpToLintMessage,
  onRunLint,
  onTagLimit,
  onUpdate,
  onUploadEyecatch,
  panel,
  preflight,
  publicationChecks,
  publicationMode,
  publicArticleLinkItems,
  publicUrl,
  relatedArticles,
  seoTitleState,
  stage,
  today,
}: WriterSidePanelContentProps) => (
  <>
    {panel === 'analysis' && (
      <WriterAnalysisPanel
        analysis={analysis}
        onChangeStage={onChangeStage}
        onInsertBlock={onInsertBlock}
        onInsertRelatedArticle={onInsertRelatedArticle}
        onJump={onJump}
        relatedArticles={relatedArticles}
        stage={stage}
      />
    )}
    {panel === 'review' && (
      <WriterReviewPanel
        body={article.body}
        isLinting={isLinting}
        messages={lintMessages}
        onApplyEdit={onApplyLintEdit}
        onJump={onJumpToLintMessage}
        onRunLint={onRunLint}
      />
    )}
    {panel === 'hints' && (
      <WriterLinkLibrary
        emptyLabel="該当するノートはない。"
        guide="記事へドラッグすると、Obsidianリンクになる。"
        isLoading={!hasLoadedHints || isLoadingHints}
        items={noteLinkItems}
        loadingLabel="ノートを探しています…"
        onDragStateChange={onDragStateChange}
        onInsert={(wikiLink) => onInsertLink(wikiLink, 'note')}
        searchLabel="非公開ノートを検索"
        searchPlaceholder="タイトルや本文から探す"
      />
    )}
    {panel === 'articles' && (
      <WriterLinkLibrary
        emptyLabel="該当する公開済み記事はない。"
        guide="記事へドラッグすると、公開時に内部リンクへ変換される。"
        items={publicArticleLinkItems}
        onDragStateChange={onDragStateChange}
        onInsert={(wikiLink) => onInsertLink(wikiLink, 'article')}
        searchLabel="公開済み記事を検索"
        searchPlaceholder="タイトル、タグ、本文概要から探す"
      />
    )}
    {panel === 'settings' && (
      <>
        <WriterPublicationReadiness checks={publicationChecks} preflight={preflight} />
        <WriterThumbnailSettings
          article={article}
          automaticTitle={automaticSeo.seoTitle}
          isGenerating={isGeneratingThumbnail}
          onGenerate={onGenerateThumbnail}
          onUpdateEyecatch={(eyecatch) => onUpdate('eyecatch', eyecatch)}
          onUploadEyecatch={onUploadEyecatch}
        />
        <WriterMetadataSettings
          article={article}
          articles={articles}
          automaticSeo={automaticSeo}
          currentSlug={currentSlug}
          descriptionState={descriptionState}
          onApplyAutomaticSeo={onApplyAutomaticSeo}
          onChangePublicationMode={onChangePublicationMode}
          onTagLimit={onTagLimit}
          onUpdate={onUpdate}
          publicationMode={publicationMode}
          publicUrl={publicUrl}
          seoTitleState={seoTitleState}
          today={today}
        />
      </>
    )}
  </>
);
