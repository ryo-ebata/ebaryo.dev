'use client';

import type { findRelatedWriterArticles, WriterAnalysis } from '@/lib/writer-analysis';
import type { createAutomaticSeo } from '@/lib/writer-seo';
import type { createWriterPreflight } from '@/lib/writer-preflight';
import type { getSeoLengthState, PublicationMode } from '@/lib/writer-publishing';
import type { MarkdownEdit } from '@/lib/writer-editing';
import type { WriterFactAnalysis } from '@/lib/writer-facts';
import type { WriterEvidenceSuggestion } from '@/lib/writer-evidence';
import type { WriterVoiceAnalysis } from '@/lib/writer-voice';
import { WriterAnalysisPanel } from './writer-analysis-panel';
import { WriterFactPanel } from './writer-fact-panel';
import { WriterLinkLibrary, type WriterLinkItem } from './writer-link-library';
import { WriterIdeaPanel } from './writer-idea-panel';
import { WriterMetadataSettings } from './writer-metadata-settings';
import type { ArticleSummary, DraftState, LintMessage, SidePanel } from './writer-model';
import { WriterPublicationReadiness } from './writer-publication-readiness';
import { WriterReviewPanel } from './writer-review-panel';
import { WriterReviewOverview } from './writer-review-overview';
import { WriterThumbnailSettings } from './writer-thumbnail-settings';
import { WriterVoicePanel } from './writer-voice-panel';

interface WriterSidePanelContentProps {
  analysis: WriterAnalysis;
  article: DraftState;
  articles: ArticleSummary[];
  automaticSeo: ReturnType<typeof createAutomaticSeo>;
  currentSlug?: string;
  descriptionState: ReturnType<typeof getSeoLengthState>;
  factAnalysis: WriterFactAnalysis;
  evidenceSuggestions: Record<number, WriterEvidenceSuggestion[]>;
  hasLoadedHints: boolean;
  isGeneratingThumbnail: boolean;
  isLinting: boolean;
  isLoadingHints: boolean;
  isLoadingIdeas: boolean;
  ideas: import('./writer-model').WriterIdea[];
  lintMessages: LintMessage[];
  clippingLinkItems: WriterLinkItem[];
  kindleLinkItems: WriterLinkItem[];
  noteLinkItems: WriterLinkItem[];
  onApplyAutomaticSeo: () => void;
  onApplyLintEdit: (edit: MarkdownEdit, dismissedIndex?: number) => void;
  onChangePublicationMode: (mode: PublicationMode) => void;
  onChangePanel: (panel: Exclude<SidePanel, null>) => void;
  onDragStateChange: (dragging: boolean) => void;
  onGenerateThumbnail: Parameters<typeof WriterThumbnailSettings>[0]['onGenerate'];
  onInsertBlock: Parameters<typeof WriterAnalysisPanel>[0]['onInsertBlock'];
  onInsertLink: (insertText: string, kind: 'article' | 'clipping' | 'kindle' | 'note') => void;
  onInsertEvidence: (insertText: string, offset: number) => void;
  onMarkAsOpinion: (offset: number) => void;
  onAddResearchNote: (offset: number) => void;
  onInsertRelatedArticle: Parameters<typeof WriterAnalysisPanel>[0]['onInsertRelatedArticle'];
  onUseIdea: (idea: import('./writer-model').WriterIdea) => void;
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
  today: string;
  voiceAnalysis: WriterVoiceAnalysis;
}

export const WriterSidePanelContent = ({
  analysis,
  article,
  articles,
  automaticSeo,
  currentSlug,
  descriptionState,
  factAnalysis,
  evidenceSuggestions,
  hasLoadedHints,
  isGeneratingThumbnail,
  isLinting,
  isLoadingHints,
  isLoadingIdeas,
  ideas,
  lintMessages,
  clippingLinkItems,
  kindleLinkItems,
  noteLinkItems,
  onApplyAutomaticSeo,
  onApplyLintEdit,
  onChangePublicationMode,
  onChangePanel,
  onDragStateChange,
  onGenerateThumbnail,
  onInsertBlock,
  onInsertLink,
  onInsertEvidence,
  onMarkAsOpinion,
  onAddResearchNote,
  onInsertRelatedArticle,
  onUseIdea,
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
  today,
  voiceAnalysis,
}: WriterSidePanelContentProps) => (
  <>
    {panel === 'analysis' && (
      <div className="grid gap-6">
        <WriterReviewOverview
          analysis={analysis}
          facts={factAnalysis}
          lintMessages={lintMessages}
          onChangePanel={onChangePanel}
          onJump={onJump}
          onJumpToLint={onJumpToLintMessage}
          voice={voiceAnalysis}
        />
        <WriterAnalysisPanel
          analysis={analysis}
          onInsertBlock={onInsertBlock}
          onInsertRelatedArticle={onInsertRelatedArticle}
          onJump={onJump}
          relatedArticles={relatedArticles}
        />
      </div>
    )}
    {panel === 'ideas' && (
      <WriterIdeaPanel ideas={ideas} isLoading={isLoadingIdeas} onUseIdea={onUseIdea} />
    )}
    {panel === 'facts' && (
      <WriterFactPanel
        analysis={factAnalysis}
        evidenceSuggestions={evidenceSuggestions}
        onAddResearchNote={onAddResearchNote}
        onInsertEvidence={onInsertEvidence}
        onJump={onJump}
        onMarkAsOpinion={onMarkAsOpinion}
      />
    )}
    {panel === 'voice' && <WriterVoicePanel analysis={voiceAnalysis} onJump={onJump} />}
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
        guide="クリック、または記事へドラッグしてObsidianリンクを挿入する。"
        isLoading={!hasLoadedHints || isLoadingHints}
        items={noteLinkItems}
        loadingLabel="ノートを探しています…"
        onDragStateChange={onDragStateChange}
        onInsert={(insertText) => onInsertLink(insertText, 'note')}
        searchLabel="非公開ノートを検索"
        searchPlaceholder="タイトルや本文から探す"
      />
    )}
    {panel === 'sources' && (
      <WriterLinkLibrary
        emptyLabel="利用できる素材はない。"
        guide="ノート、Kindle、Clip、公開記事をまとめて検索し、本文へ挿入する。"
        isLoading={!hasLoadedHints || isLoadingHints}
        items={[
          ...noteLinkItems,
          ...kindleLinkItems,
          ...clippingLinkItems,
          ...publicArticleLinkItems,
        ]}
        loadingLabel="素材を探しています…"
        onDragStateChange={onDragStateChange}
        onInsert={(insertText) => {
          const kind = noteLinkItems.some((item) => item.insertText === insertText)
            ? 'note'
            : kindleLinkItems.some((item) => item.insertText === insertText)
              ? 'kindle'
              : clippingLinkItems.some((item) => item.insertText === insertText)
                ? 'clipping'
                : 'article';
          onInsertLink(insertText, kind);
        }}
        searchLabel="すべての素材を検索"
        searchPlaceholder="タイトル、本文、著者、タグから探す"
      />
    )}
    {panel === 'kindle' && (
      <WriterLinkLibrary
        emptyLabel="利用できるKindle本はない。"
        guide="クリック、または記事へドラッグしてAmazon商品リンクを挿入する。保存時にアフィリエイト化する。"
        isLoading={!hasLoadedHints || isLoadingHints}
        items={kindleLinkItems}
        loadingLabel="Kindle本を探しています…"
        onDragStateChange={onDragStateChange}
        onInsert={(insertText) => onInsertLink(insertText, 'kindle')}
        searchLabel="Kindle本を検索"
        searchPlaceholder="書名、著者、ASINから探す"
      />
    )}
    {panel === 'clippings' && (
      <WriterLinkLibrary
        emptyLabel="利用できるClippingはない。"
        guide="クリック、または記事へドラッグして保存元への外部リンクを挿入する。"
        isLoading={!hasLoadedHints || isLoadingHints}
        items={clippingLinkItems}
        loadingLabel="Clippingを探しています…"
        onDragStateChange={onDragStateChange}
        onInsert={(insertText) => onInsertLink(insertText, 'clipping')}
        searchLabel="Clippingを検索"
        searchPlaceholder="タイトル、概要、ドメインから探す"
      />
    )}
    {panel === 'articles' && (
      <WriterLinkLibrary
        emptyLabel="該当する公開済み記事はない。"
        guide="クリック、または記事へドラッグして内部リンクを挿入する。"
        items={publicArticleLinkItems}
        onDragStateChange={onDragStateChange}
        onInsert={(insertText) => onInsertLink(insertText, 'article')}
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
