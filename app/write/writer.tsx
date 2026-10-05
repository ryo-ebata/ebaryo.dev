'use client';

import {
  Bold,
  Code2,
  Columns2,
  Eye,
  ImagePlus,
  Lightbulb,
  Link,
  ListTree,
  ListChecks,
  PanelRight,
  Pencil,
  Quote,
  Heading2,
} from 'lucide-react';
import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { siteConfig } from '@/config/site';
import {
  createObsidianWikiLink,
  createPublicArticleWikiLink,
  OBSIDIAN_HINT_MIME,
} from '@/lib/local-writer-hints';
import { createAutomaticSeo } from '@/lib/writer-seo';
import { analyzeWriterDraft, findRelatedWriterArticles } from '@/lib/writer-analysis';
import { createWriterPreflight } from '@/lib/writer-preflight';
import { normalizeWriterMarkdown } from '@/lib/writer-markdown';
import {
  applyPublicationMode,
  getPublicationMode,
  getSeoLengthState,
  type PublicationMode,
} from '@/lib/writer-publishing';
import { continueMarkdownLine } from '@/lib/writer-editing';
import {
  type DraftState,
  type NoteHint,
  type SidePanel,
  type ViewMode,
  type VisibleSidePanel,
  type WritingStage,
} from './writer-model';
import { useWriterDocument } from './use-writer-document';
import { useWriterEditor } from './use-writer-editor';
import { useWriterImages } from './use-writer-images';
import { useWriterLint } from './use-writer-lint';
import { WriterArticlePicker } from './writer-article-picker';
import { WriterAnalysisPanel } from './writer-analysis-panel';
import { WriterInspector } from './writer-inspector';
import { WriterPreview } from './writer-preview';
import { WriterLinkLibrary, type WriterLinkItem } from './writer-link-library';
import { WriterMetadataSettings } from './writer-metadata-settings';
import { WriterPublicationReadiness } from './writer-publication-readiness';
import { WriterReviewPanel } from './writer-review-panel';
import { WriterThumbnailSettings } from './writer-thumbnail-settings';
import styles from './writer.module.css';

export function Writer() {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [writingStage, setWritingStage] = useState<WritingStage>('outline');
  const [noteHints, setNoteHints] = useState<NoteHint[]>([]);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [hasLoadedHints, setHasLoadedHints] = useState(false);
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
  const lastSidePanelRef = useRef<VisibleSidePanel>('hints');
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

  const characterCount = useMemo(() => article.body.replace(/\s/g, '').length, [article.body]);
  const automaticSeo = useMemo(() => createAutomaticSeo(article), [article]);
  const today = new Date().toISOString().slice(0, 10);
  const publicationMode = getPublicationMode(article, today);
  const publicUrl =
    article.canonicalUrl || `${siteConfig.url}/blog/${article.slug || 'article-slug'}`;
  const seoTitleState = getSeoLengthState(automaticSeo.seoTitle.length, 30, 60);
  const descriptionState = getSeoLengthState(automaticSeo.description.length, 70, 160);
  const thumbnailTags = article.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const previewSlug = currentSlug ?? article.slug;
  const previewEyecatch = article.eyecatch?.url.trim()
    ? {
        ...article.eyecatch,
        url:
          /^(?:https?:|\/)/u.test(article.eyecatch.url) || !previewSlug
            ? article.eyecatch.url
            : `/blog-assets/${previewSlug}/${article.eyecatch.url.replace(/^\.\//u, '')}`,
      }
    : undefined;
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
    [
      article.eyecatch,
      article.slug,
      article.tags,
      article.title,
      automaticSeo.description,
      article.body,
      lastLintedBody,
      lintMessages,
    ]
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
  const update = <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => {
    updateArticle(key, value);
    if (key === 'body') clearLint();
  };

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
      setWritingStage('publish');
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

  const openHints = () => {
    setSidePanel('hints');
  };

  useEffect(() => {
    if (sidePanel !== 'hints' || hasLoadedHints || isLoadingHints) return;
    const loadHints = async () => {
      setIsLoadingHints(true);
      try {
        const response = await fetch('/api/local-writer/hints');
        const result = (await response.json()) as { error?: string; notes?: NoteHint[] };
        if (!response.ok) throw new Error(result.error ?? 'ヒントを読み込めませんでした');
        setNoteHints(result.notes ?? []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'ヒントを読み込めませんでした');
      } finally {
        setIsLoadingHints(false);
        setHasLoadedHints(true);
      }
    };
    void loadHints();
  }, [hasLoadedHints, isLoadingHints, sidePanel]);

  const uploadImage = async (file: File, purpose: 'body' | 'eyecatch' = 'body') => {
    await saveImage(file, purpose, getSelectionRange());
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    setIsDraggingHint(false);
    const noteLink = event.dataTransfer.getData(OBSIDIAN_HINT_MIME);
    if (noteLink) {
      insertAtCursor(noteLink, selectionRef.current);
      setMessage('Obsidianノートへのリンクを追加した');
      return;
    }
    const image = [...event.dataTransfer.files].find((file) => file.type.startsWith('image/'));
    if (image) void uploadImage(image);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!sidePanel) return;
    lastSidePanelRef.current = sidePanel;
    const closePanel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidePanel(null);
    };
    window.addEventListener('keydown', closePanel);
    return () => window.removeEventListener('keydown', closePanel);
  }, [sidePanel]);

  return (
    <div className={styles.shell}>
      <form className={styles.workspace} onSubmit={save}>
        <header className={styles.header}>
          <WriterArticlePicker
            articles={articles}
            currentSlug={currentSlug}
            currentTitle={article.title}
            onNewArticle={createNewArticle}
            onOpenArticle={loadArticle}
          />
          <div className={styles.status} aria-live="polite">
            <span>{isSaving ? '保存しています…' : message}</span>
            {draftSavedAt && <span className={styles.localStatus}>{draftSavedAt}</span>}
          </div>
          <div className={styles.headerActions}>
            <input
              ref={imageInputRef}
              accept="image/gif,image/jpeg,image/png,image/webp"
              className={styles.fileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
                event.target.value = '';
              }}
              type="file"
            />
            <div className={styles.viewSwitcher} aria-label="表示モード">
              <button
                aria-label="編集のみ"
                aria-pressed={viewMode === 'edit'}
                onClick={() => setViewMode('edit')}
                title="編集"
                type="button"
              >
                <Pencil />
              </button>
              <button
                aria-label="編集とプレビュー"
                aria-pressed={viewMode === 'split'}
                onClick={() => setViewMode('split')}
                title="分割"
                type="button"
              >
                <Columns2 />
              </button>
              <button
                aria-label="プレビューのみ"
                aria-pressed={viewMode === 'preview'}
                onClick={() => setViewMode('preview')}
                title="プレビュー"
                type="button"
              >
                <Eye />
              </button>
            </div>
            <button
              aria-expanded={Boolean(sidePanel)}
              aria-label={sidePanel ? 'サイドバーを隠す' : 'サイドバーを表示'}
              className={styles.sidebarToggle}
              onClick={() => setSidePanel((current) => (current ? null : lastSidePanelRef.current))}
              type="button"
            >
              <PanelRight />
              <span>執筆支援</span>
            </button>
            <button
              aria-expanded={sidePanel === 'settings'}
              className={styles.textButton}
              onClick={() => setSidePanel((value) => (value === 'settings' ? null : 'settings'))}
              type="button"
            >
              公開
            </button>
            <button className={styles.saveButton} disabled={isSaving} type="submit">
              <span>
                {isSaving
                  ? '保存中…'
                  : currentSlug
                    ? article.draft
                      ? '下書きを更新'
                      : '記事を更新'
                    : article.draft
                      ? '下書きを保存'
                      : '公開する'}
              </span>
            </button>
          </div>
        </header>
        <main
          className={`${styles.editor} ${styles[viewMode]} ${sidePanel ? styles.editorWithInspector : ''}`}
        >
          <section
            className={`${styles.paper} ${isDragging ? styles.dragging : ''}`}
            aria-label="本文編集"
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              aria-label="記事タイトル"
              className={styles.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="記事のタイトル"
              value={article.title}
            />
            <div className={styles.bodyEditor}>
              {lintMessages.length > 0 && (
                <div className={styles.bodyLintFeedback} aria-live="polite">
                  <span className={styles.bodyLintCount}>校正 {lintMessages.length}件</span>
                  <button onClick={() => jumpToLintMessage(activeLintIndex ?? 0)} type="button">
                    <strong>
                      {activeLintIndex === null
                        ? '指摘を見る'
                        : `${lintMessages[activeLintIndex]?.line}行目`}
                    </strong>
                    <span>{lintMessages[activeLintIndex ?? 0]?.message}</span>
                  </button>
                </div>
              )}
              <textarea
                aria-label="記事本文"
                ref={bodyRef}
                className={styles.body}
                onChange={(event) => update('body', event.target.value)}
                onKeyDown={(event) => {
                  const modifier = event.metaKey || event.ctrlKey;
                  if (modifier && event.key.toLocaleLowerCase() === 'b') {
                    event.preventDefault();
                    formatSelection('bold');
                    return;
                  }
                  if (modifier && event.key.toLocaleLowerCase() === 'k') {
                    event.preventDefault();
                    formatSelection('link');
                    return;
                  }
                  if (modifier && event.key.toLocaleLowerCase() === 'e') {
                    event.preventDefault();
                    formatSelection('code');
                    return;
                  }
                  if (event.key === 'Enter' && !event.shiftKey) {
                    const edit = continueMarkdownLine(
                      article.body,
                      event.currentTarget.selectionStart
                    );
                    if (edit) {
                      event.preventDefault();
                      applyMarkdownEdit(edit);
                    }
                  }
                }}
                onSelect={(event) => {
                  rememberSelection({
                    end: event.currentTarget.selectionEnd,
                    start: event.currentTarget.selectionStart,
                  });
                }}
                onPaste={(event) => {
                  const image = [...event.clipboardData.files].find((file) =>
                    file.type.startsWith('image/')
                  );
                  if (image) {
                    event.preventDefault();
                    void uploadImage(image);
                    return;
                  }
                  const pastedText = event.clipboardData.getData('text/plain').trim();
                  const textarea = event.currentTarget;
                  const selectedText = textarea.value.slice(
                    textarea.selectionStart,
                    textarea.selectionEnd
                  );
                  if (selectedText && /^https?:\/\/\S+$/u.test(pastedText)) {
                    event.preventDefault();
                    insertAtCursor(`[${selectedText}](${pastedText})`, {
                      end: textarea.selectionEnd,
                      start: textarea.selectionStart,
                    });
                  }
                }}
                placeholder="本文を書く…"
                spellCheck="true"
                value={article.body}
              />
              {lintMessages.length > 0 && (
                <div className={styles.lintMarkers} aria-label="本文の校正指摘">
                  {lintMessages.map((item, index) => (
                    <button
                      aria-label={`${item.line}行目: ${item.message}`}
                      aria-pressed={activeLintIndex === index}
                      key={`${item.line}-${item.column}-${index}`}
                      onClick={() => jumpToLintMessage(index)}
                      style={{
                        top: `${((item.line - 1) / Math.max(1, article.body.split('\n').length - 1)) * 100}%`,
                      }}
                      type="button"
                    />
                  ))}
                </div>
              )}
            </div>
            {isDragging && (
              <div className={styles.dropOverlay}>
                {isDraggingHint ? <Lightbulb /> : <ImagePlus />}
                {isDraggingHint ? 'ここにリンクを置く' : 'ここに画像を置く'}
              </div>
            )}
            <footer className={styles.editorFooter}>
              <details className={styles.writingTools}>
                <summary>＋ 執筆環境</summary>
                <div className={styles.writingToolsMenu}>
                  <div className={styles.formatTools} aria-label="書式">
                    <button onClick={() => formatSelection('heading')} title="見出し" type="button">
                      <Heading2 />
                    </button>
                    <button onClick={() => formatSelection('bold')} title="太字 ⌘B" type="button">
                      <Bold />
                    </button>
                    <button onClick={() => formatSelection('link')} title="リンク ⌘K" type="button">
                      <Link />
                    </button>
                    <button onClick={() => formatSelection('quote')} title="引用" type="button">
                      <Quote />
                    </button>
                    <button onClick={() => formatSelection('code')} title="コード ⌘E" type="button">
                      <Code2 />
                    </button>
                  </div>
                  <button onClick={() => imageInputRef.current?.click()} type="button">
                    <ImagePlus />
                    画像
                  </button>
                  <button disabled={isLinting} onClick={() => void runLint()} type="button">
                    <ListChecks />
                    {isLinting ? '校正中' : '文章を校正'}
                  </button>
                  <button onClick={openHints} type="button">
                    <Lightbulb />
                    ノートからヒント
                  </button>
                  <button onClick={() => setSidePanel('analysis')} type="button">
                    <ListTree />
                    構成を確認
                  </button>
                  <button onClick={() => setSidePanel('settings')} type="button">
                    <PanelRight />
                    公開設定
                  </button>
                </div>
              </details>
              <div className={styles.documentMeta}>
                <span>{characterCount.toLocaleString('ja-JP')}文字</span>
              </div>
            </footer>
          </section>
          {viewMode !== 'edit' && (
            <div className={styles.previewPane} aria-label="Markdownプレビュー">
              <WriterPreview body={article.body} metadata={previewMetadata} slug={previewSlug} />
            </div>
          )}
          <WriterInspector
            isDraggingLink={isDraggingHint}
            lintCount={lintMessages.length}
            onChange={setSidePanel}
            onClose={() => setSidePanel(null)}
            panel={sidePanel}
          >
            {sidePanel === 'analysis' && (
              <WriterAnalysisPanel
                analysis={writingAnalysis}
                onChangeStage={(stage) => {
                  setWritingStage(stage);
                  if (stage === 'outline') {
                    setViewMode('edit');
                    setSidePanel('analysis');
                  } else if (stage === 'draft') {
                    setViewMode('edit');
                    setSidePanel('hints');
                  } else if (stage === 'review') {
                    void runLint();
                  } else {
                    setSidePanel('settings');
                  }
                }}
                onInsertBlock={(block) => {
                  insertAtCursor(block.text, selectionRef.current);
                  setMessage(`${block.label}ブロックを追加した`);
                }}
                onInsertRelatedArticle={(relatedArticle) => {
                  insertAtCursor(
                    `[${relatedArticle.title}](/blog/${relatedArticle.slug})`,
                    selectionRef.current
                  );
                  setMessage('関連記事へのリンクを追加した');
                }}
                onJump={jumpToBodyOffset}
                relatedArticles={relatedArticles}
                stage={writingStage}
              />
            )}
            {sidePanel === 'review' && (
              <WriterReviewPanel
                body={article.body}
                isLinting={isLinting}
                messages={lintMessages}
                onApplyEdit={(edit, dismissedIndex) => {
                  applyMarkdownEdit(edit);
                  if (dismissedIndex !== undefined) dismissLint(dismissedIndex);
                }}
                onJump={jumpToLintMessage}
                onRunLint={() => void runLint()}
              />
            )}
            {sidePanel === 'hints' && (
              <WriterLinkLibrary
                emptyLabel="該当するノートはない。"
                guide="記事へドラッグすると、Obsidianリンクになる。"
                isLoading={!hasLoadedHints || isLoadingHints}
                items={noteLinkItems}
                loadingLabel="ノートを探しています…"
                onDragStateChange={(dragging) => {
                  setIsDraggingHint(dragging);
                  if (!dragging) setIsDragging(false);
                }}
                onInsert={(wikiLink) => {
                  insertAtCursor(wikiLink, selectionRef.current);
                  setMessage('Obsidianノートへのリンクを追加した');
                }}
                searchLabel="非公開ノートを検索"
                searchPlaceholder="タイトルや本文から探す"
              />
            )}
            {sidePanel === 'articles' && (
              <WriterLinkLibrary
                emptyLabel="該当する公開済み記事はない。"
                guide="記事へドラッグすると、公開時に内部リンクへ変換される。"
                items={publicArticleLinkItems}
                onDragStateChange={(dragging) => {
                  setIsDraggingHint(dragging);
                  if (!dragging) setIsDragging(false);
                }}
                onInsert={(wikiLink) => {
                  insertAtCursor(wikiLink, selectionRef.current);
                  setMessage('公開記事への内部リンクを追加した');
                }}
                searchLabel="公開済み記事を検索"
                searchPlaceholder="タイトル、タグ、本文概要から探す"
              />
            )}
            {sidePanel === 'settings' && (
              <WriterPublicationReadiness checks={publicationChecks} preflight={preflight} />
            )}
            {sidePanel === 'settings' && (
              <WriterThumbnailSettings
                article={article}
                automaticTitle={automaticSeo.seoTitle}
                isGenerating={isGeneratingThumbnail}
                onGenerate={createThumbnail}
                onUpdateEyecatch={(eyecatch) => update('eyecatch', eyecatch)}
                onUploadEyecatch={(file) => uploadImage(file, 'eyecatch')}
              />
            )}
            {sidePanel === 'settings' && (
              <WriterMetadataSettings
                article={article}
                articles={articles}
                automaticSeo={automaticSeo}
                currentSlug={currentSlug}
                descriptionState={descriptionState}
                onApplyAutomaticSeo={() => {
                  setArticle((current) => ({ ...current, ...createAutomaticSeo(current) }));
                  setIsDirty(true);
                  setMessage('SEO設定を自動入力した');
                }}
                onChangePublicationMode={changePublicationMode}
                onTagLimit={() => setMessage('タグは12個までです')}
                onUpdate={update}
                publicationMode={publicationMode}
                publicUrl={publicUrl}
                seoTitleState={seoTitleState}
                today={today}
              />
            )}
          </WriterInspector>
        </main>
      </form>
    </div>
  );
}
