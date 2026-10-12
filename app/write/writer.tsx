'use client';

import { type DragEvent, type FormEvent, useCallback, useRef, useState } from 'react';
import { WRITER_INSERT_MIME } from '@/lib/local-writer-hints';
import { createAutomaticSeo } from '@/lib/writer-seo';
import { normalizeWriterMarkdown } from '@/lib/writer-markdown';
import { applyPublicationMode, type PublicationMode } from '@/lib/writer-publishing';
import { type DraftState, type SidePanel, type ViewMode } from './writer-model';
import { useWriterDocument } from './use-writer-document';
import { useWriterDerivedState } from './use-writer-derived-state';
import { useWriterEditor } from './use-writer-editor';
import { useWriterHints } from './use-writer-hints';
import { useWriterIdeas } from './use-writer-ideas';
import { useWriterImages } from './use-writer-images';
import { useWriterLifecycle } from './use-writer-lifecycle';
import { useWriterLint } from './use-writer-lint';
import { WriterEditorCanvas } from './writer-editor-canvas';
import { WriterHeader } from './writer-header';
import { WriterInspector } from './writer-inspector';
import { WriterPreview } from './writer-preview';
import { WriterSidePanelContent } from './writer-side-panel-content';
import { cn } from '@/lib/utils';

export function Writer() {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHint, setIsDraggingHint] = useState(false);
  const resetDocumentFeedbackRef = useRef<() => void>(() => undefined);
  const {
    article,
    articleRef,
    articles,
    currentSlug,
    draftSavedAt,
    isDirty,
    isSaving,
    message,
    newArticle: createNewArticle,
    openArticle: loadArticle,
    publishedArticleSlug,
    saveDocument,
    setArticle,
    setIsDirty,
    setMessage,
    updateArticle,
    voiceProfile,
  } = useWriterDocument({ onDocumentReplaced: () => resetDocumentFeedbackRef.current() });
  const {
    activeLintIndex,
    clearLint,
    dismissLint,
    isLinting,
    lastLintedBody,
    lintMessages,
    resetLint,
    runLint,
    setActiveLintIndex,
    setLastLintedBody,
  } = useWriterLint({
    articleRef,
    onOpenReview: () => setSidePanel('review'),
    setMessage,
  });
  resetDocumentFeedbackRef.current = resetLint;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { clippingHints, hasLoadedHints, isLoadingHints, kindleHints, noteHints } = useWriterHints(
    sidePanel,
    setMessage
  );
  const { hasLoadedIdeas, ideas, isLoadingIdeas } = useWriterIdeas(sidePanel, setMessage);
  const {
    applyMarkdownEdit,
    bodyRef,
    formatSelection,
    getSelectionRange,
    insertAtCursor,
    jumpToBodyOffset,
    jumpToLintMessage,
    rememberSelection,
    selectionRef,
  } = useWriterEditor({
    articleRef,
    clearLint,
    lintMessages,
    setActiveLintIndex,
    setArticle,
    setIsDirty,
    setMessage,
    setViewMode,
  });
  const {
    generateThumbnail: createThumbnail,
    isGeneratingThumbnail,
    uploadImage: saveImage,
  } = useWriterImages({
    article,
    articleRef,
    insertMarkdown: insertAtCursor,
    onEyecatch: (eyecatch) => updateArticle('eyecatch', eyecatch),
    onMissingSlug: () => setSidePanel('settings'),
    setMessage,
  });

  const {
    automaticSeo,
    characterCount,
    clippingLinkItems,
    descriptionState,
    evidenceSuggestions,
    factAnalysis,
    kindleLinkItems,
    nextAction,
    noteLinkItems,
    preflight,
    previewMetadata,
    previewSlug,
    publicationChecks,
    publicationMode,
    publicArticleLinkItems,
    publicUrl,
    relatedArticles,
    seoTitleState,
    today,
    voiceAnalysis,
    writingAnalysis,
  } = useWriterDerivedState({
    article,
    articles,
    clippingHints,
    currentSlug,
    kindleHints,
    lastLintedBody,
    lintMessages,
    noteHints,
    voiceProfile,
  });
  const update = <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => {
    updateArticle(key, value);
    if (key === 'body') clearLint();
  };
  const jumpFromInspector = useCallback(
    (offset: number) => {
      jumpToBodyOffset(offset);
      if (window.matchMedia('(max-width: 1179px)').matches) setSidePanel(null);
    },
    [jumpToBodyOffset]
  );

  const changePublicationMode = (mode: PublicationMode) => {
    setArticle((current) => applyPublicationMode(current, mode, today));
    setIsDirty(true);
    setMessage('公開状態を変更した');
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSaving) return;
    const isUpdatingPublishedArticle = !article.draft && currentSlug === publishedArticleSlug;
    if (!article.draft && !isUpdatingPublishedArticle && preflight.blockers.length > 0) {
      setSidePanel('settings');
      setMessage(`公開前チェック: ${preflight.blockers[0].label}`);
      return;
    }
    if (!article.draft && lastLintedBody !== article.body) {
      const result = await runLint(false);
      if (!result) return;
    }
    const normalizedBody = normalizeWriterMarkdown(article.body);
    const affiliateLinksConverted = normalizedBody !== article.body;
    const preparedArticle = { ...article, ...automaticSeo, body: normalizedBody };
    await saveDocument({
      article: preparedArticle,
      message: (path) =>
        affiliateLinksConverted
          ? '保存済み: AmazonリンクをアフィリエイトURLへ変換'
          : `保存済み: ${path}`,
      onSaved: () => {
        if (lastLintedBody === article.body) setLastLintedBody(normalizedBody);
      },
    });
  };

  const openHints = () => setSidePanel('sources');

  const uploadImage = async (file: File, purpose: 'body' | 'eyecatch' = 'body') => {
    await saveImage(file, purpose, getSelectionRange());
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    setIsDraggingHint(false);
    const insertText = event.dataTransfer.getData(WRITER_INSERT_MIME);
    if (insertText) {
      insertAtCursor(insertText, selectionRef.current);
      setMessage('リンクを追加した');
      return;
    }
    const image = [...event.dataTransfer.files].find((file) => file.type.startsWith('image/'));
    if (image) void uploadImage(image);
  };

  const toggleSidebar = useWriterLifecycle({
    isDirty,
    onSave: () => void save(),
    setSidePanel,
    sidePanel,
  });

  return (
    <div className="fixed inset-x-0 top-[6.75rem] bottom-0 z-40 overflow-hidden bg-[var(--writer-paper)] text-[var(--writer-ink)] [color-scheme:light] [&_button]:min-h-11 [&_button]:min-w-11 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--writer-focus)] [&_input:focus-visible]:outline-3 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-[var(--writer-focus)] [&_select:focus-visible]:outline-3 [&_select:focus-visible]:outline-offset-2 [&_select:focus-visible]:outline-[var(--writer-focus)] [&_textarea:focus-visible]:outline-3 [&_textarea:focus-visible]:outline-offset-2 [&_textarea:focus-visible]:outline-[var(--writer-focus)]">
      <form className="h-full" onSubmit={save}>
        <WriterHeader
          article={article}
          articles={articles}
          currentSlug={currentSlug}
          draftSavedAt={draftSavedAt}
          imageInputRef={imageInputRef}
          isSaving={isSaving}
          message={message}
          onNewArticle={createNewArticle}
          onOpenArticle={loadArticle}
          onSetSidePanel={setSidePanel}
          onSetViewMode={setViewMode}
          onToggleSidebar={toggleSidebar}
          onUploadImage={(file) => void uploadImage(file)}
          sidePanel={sidePanel}
          viewMode={viewMode}
        />
        <main
          className={cn(
            'grid h-[calc(100%-4rem)] overflow-auto transition-[margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-[900px]:h-[calc(100%-5.5rem)]',
            sidePanel && 'min-[1180px]:mr-[23rem]',
            viewMode === 'split' &&
              'grid-cols-[minmax(24rem,1fr)_minmax(24rem,1fr)] max-[900px]:grid-cols-1',
            viewMode === 'preview' && '[&_[data-writer-paper]]:hidden',
            viewMode === 'split' && 'max-[900px]:[&_[data-writer-paper]]:hidden'
          )}
        >
          <WriterEditorCanvas
            activeLintIndex={activeLintIndex}
            article={article}
            bodyRef={bodyRef}
            characterCount={characterCount}
            isDragging={isDragging}
            isDraggingHint={isDraggingHint}
            isLinting={isLinting}
            lintMessages={lintMessages}
            onApplyMarkdownEdit={applyMarkdownEdit}
            onDrop={handleDrop}
            onFormat={formatSelection}
            onInsertAtCursor={insertAtCursor}
            onJumpToLintMessage={jumpToLintMessage}
            onOpenAnalysis={() => setSidePanel('analysis')}
            onOpenHints={openHints}
            onOpenSettings={() => setSidePanel('settings')}
            onRememberSelection={rememberSelection}
            onRunLint={() => void runLint()}
            onSetDragging={setIsDragging}
            onUpdate={update}
            onUploadImage={(file) => void uploadImage(file)}
            onUploadRequest={() => imageInputRef.current?.click()}
          />
          {viewMode !== 'edit' && (
            <div
              className={cn(
                'overflow-auto border-l border-[var(--writer-line-subtle)] bg-background p-8 max-[900px]:border-l-0 max-[640px]:px-5 max-[640px]:py-10',
                viewMode === 'split' && 'px-4 py-6'
              )}
              aria-label="Markdownプレビュー"
            >
              <WriterPreview body={article.body} metadata={previewMetadata} slug={previewSlug} />
            </div>
          )}
          <WriterInspector
            isDraggingLink={isDraggingHint}
            lintCount={lintMessages.length}
            nextAction={nextAction}
            onActivateNextAction={(action) => {
              if (action.offset !== undefined) {
                setSidePanel(action.panel);
                jumpFromInspector(action.offset);
                return;
              }
              setSidePanel(action.panel);
            }}
            onChange={setSidePanel}
            onClose={() => setSidePanel(null)}
            panelCounts={{
              analysis:
                writingAnalysis.readerExperience.findings.length + writingAnalysis.gaps.length,
              articles: publicArticleLinkItems.length,
              clippings: clippingLinkItems.length,
              facts: factAnalysis.needsEvidenceCount,
              hints: noteLinkItems.length,
              ideas: ideas.length,
              kindle: kindleLinkItems.length,
              review: lintMessages.length,
              sources:
                noteLinkItems.length +
                kindleLinkItems.length +
                clippingLinkItems.length +
                publicArticleLinkItems.length,
              voice: voiceAnalysis.findings.length,
            }}
            panel={sidePanel}
          >
            <WriterSidePanelContent
              analysis={writingAnalysis}
              article={article}
              articles={articles}
              automaticSeo={automaticSeo}
              currentSlug={currentSlug}
              descriptionState={descriptionState}
              evidenceSuggestions={evidenceSuggestions}
              factAnalysis={factAnalysis}
              hasLoadedHints={hasLoadedHints}
              ideas={ideas}
              isGeneratingThumbnail={isGeneratingThumbnail}
              isLinting={isLinting}
              isLoadingHints={isLoadingHints}
              isLoadingIdeas={!hasLoadedIdeas || isLoadingIdeas}
              lintMessages={lintMessages}
              clippingLinkItems={clippingLinkItems}
              kindleLinkItems={kindleLinkItems}
              noteLinkItems={noteLinkItems}
              onApplyAutomaticSeo={() => {
                setArticle((current) => ({ ...current, ...createAutomaticSeo(current) }));
                setIsDirty(true);
                setMessage('SEO設定を自動入力した');
              }}
              onApplyLintEdit={(edit, dismissedIndex) => {
                applyMarkdownEdit(edit);
                if (dismissedIndex !== undefined) dismissLint(dismissedIndex);
              }}
              onChangePublicationMode={changePublicationMode}
              onChangePanel={setSidePanel}
              onDragStateChange={(dragging) => {
                setIsDraggingHint(dragging);
                if (!dragging) setIsDragging(false);
              }}
              onGenerateThumbnail={createThumbnail}
              onInsertBlock={(block) => {
                insertAtCursor(block.text, selectionRef.current);
                setMessage(`${block.label}ブロックを追加した`);
              }}
              onInsertLink={(insertText, kind) => {
                insertAtCursor(insertText, selectionRef.current);
                const messages = {
                  article: '公開記事への内部リンクを追加した',
                  clipping: 'Clippingの外部リンクを追加した',
                  kindle: 'Kindle本のAmazonリンクを追加した',
                  note: 'Obsidianノートへのリンクを追加した',
                };
                setMessage(messages[kind]);
              }}
              onInsertEvidence={(insertText, offset) => {
                insertAtCursor(` ${insertText}`, { end: offset, start: offset });
                setMessage('根拠を主張へ追加した');
              }}
              onMarkAsOpinion={(offset) => {
                insertAtCursor('筆者の見解では、', { end: offset, start: offset });
                setMessage('主張を見解として明示した');
              }}
              onAddResearchNote={(offset) => {
                insertAtCursor('\n<!-- TODO: 根拠を確認 -->', { end: offset, start: offset });
                setMessage('調査メモを追加した');
              }}
              onInsertRelatedArticle={(relatedArticle) => {
                insertAtCursor(
                  `[${relatedArticle.title}](/blog/${relatedArticle.slug})`,
                  selectionRef.current
                );
                setMessage('関連記事へのリンクを追加した');
              }}
              onUseIdea={(idea) => {
                if (
                  !createNewArticle({
                    body: idea.body,
                    tags: idea.tags.join(', '),
                    title: idea.title,
                  })
                )
                  return;
                setViewMode('edit');
                setSidePanel('analysis');
              }}
              onJump={jumpFromInspector}
              onJumpToLintMessage={(index) => {
                jumpToLintMessage(index);
                if (window.matchMedia('(max-width: 1179px)').matches) setSidePanel(null);
              }}
              onRunLint={() => void runLint()}
              onTagLimit={() => setMessage('タグは12個までです')}
              onUpdate={update}
              onUploadEyecatch={(file) => uploadImage(file, 'eyecatch')}
              panel={sidePanel}
              preflight={preflight}
              publicationChecks={publicationChecks}
              publicationMode={publicationMode}
              publicArticleLinkItems={publicArticleLinkItems}
              publicUrl={publicUrl}
              relatedArticles={relatedArticles}
              seoTitleState={seoTitleState}
              today={today}
              voiceAnalysis={voiceAnalysis}
            />
          </WriterInspector>
        </main>
      </form>
    </div>
  );
}
