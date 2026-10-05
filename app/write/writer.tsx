'use client';

import {
  Bold,
  Check,
  ChevronDown,
  Code2,
  Columns2,
  Eye,
  FilePlus2,
  ImagePlus,
  Lightbulb,
  Link,
  ListTree,
  ListChecks,
  PanelRight,
  Pencil,
  Quote,
  Search,
  Heading2,
  X,
} from 'lucide-react';
import {
  type DragEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { siteConfig } from '@/config/site';
import { OBSIDIAN_HINT_MIME } from '@/lib/local-writer-hints';
import { createAutomaticSeo } from '@/lib/writer-seo';
import { analyzeWriterDraft, findRelatedWriterArticles } from '@/lib/writer-analysis';
import { createWriterPreflight } from '@/lib/writer-preflight';
import { normalizeWriterMarkdown } from '@/lib/writer-markdown';
import { getThemesForTags } from '@/lib/themes';
import {
  recommendThumbnailPreset,
  THUMBNAIL_PRESETS,
  type ThumbnailLayout,
  type ThumbnailMotif,
  type ThumbnailVariant,
} from '@/lib/og/og-params';
import {
  applyPublicationMode,
  getPublicationMode,
  getSeoLengthState,
  type PublicationMode,
} from '@/lib/writer-publishing';
import {
  continueMarkdownLine,
  formatInlineMarkdown,
  prefixMarkdownLines,
  type MarkdownEdit,
} from '@/lib/writer-editing';
import {
  ARTICLE_PICKER_HEADINGS,
  ARTICLE_PICKER_MODES,
  MAINTENANCE_ACTIONS,
  MAINTENANCE_LABELS,
  STAGE_LABELS,
  WRITING_BLOCKS,
} from './writer-config';
import {
  type ArticlePickerMode,
  type ArticleSummary,
  createInitialState,
  type DraftState,
  getLintCategory,
  type LintMessage,
  matchesArticlePickerMode,
  type NoteHint,
  type SidePanel,
  STORAGE_KEY,
  type ViewMode,
  type VisibleSidePanel,
  type WritingStage,
} from './writer-model';
import { WriterPreview } from './writer-preview';
import styles from './writer.module.css';

export function Writer() {
  const [article, setArticle] = useState(createInitialState);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [articleQuery, setArticleQuery] = useState('');
  const [articlePickerMode, setArticlePickerMode] = useState<ArticlePickerMode>('all');
  const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string>();
  const [publishedArticleSlug, setPublishedArticleSlug] = useState<string>();
  const [message, setMessage] = useState('未保存');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string>();
  const [isLinting, setIsLinting] = useState(false);
  const [lintMessages, setLintMessages] = useState<LintMessage[]>([]);
  const [activeLintIndex, setActiveLintIndex] = useState<number | null>(null);
  const [lastLintedBody, setLastLintedBody] = useState<string>();
  const [writingStage, setWritingStage] = useState<WritingStage>('outline');
  const [noteHints, setNoteHints] = useState<NoteHint[]>([]);
  const [hintQuery, setHintQuery] = useState('');
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [hasLoadedHints, setHasLoadedHints] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingHint, setIsDraggingHint] = useState(false);
  const [thumbnailVariant, setThumbnailVariant] = useState<ThumbnailVariant>('paper');
  const [thumbnailLayout, setThumbnailLayout] = useState<ThumbnailLayout>('editorial');
  const [thumbnailMotif, setThumbnailMotif] = useState<ThumbnailMotif>('native');
  const [thumbnailSubtitleOverride, setThumbnailSubtitleOverride] = useState('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const eyecatchInputRef = useRef<HTMLInputElement>(null);
  const articleSearchRef = useRef<HTMLInputElement>(null);
  const articlePickerTriggerRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef(article);
  const openRequestRef = useRef(0);
  const selectionRef = useRef({ start: 0, end: 0 });
  const lastSidePanelRef = useRef<VisibleSidePanel>('hints');

  const loadArticleList = async () => {
    const response = await fetch('/api/local-writer');
    if (response.ok)
      setArticles(((await response.json()) as { articles: ArticleSummary[] }).articles);
  };

  useEffect(() => {
    void loadArticleList();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const restored = JSON.parse(saved) as
        | DraftState
        | { article: DraftState; currentSlug?: string };
      if ('article' in restored) {
        setArticle({ ...createInitialState(), ...restored.article });
        setCurrentSlug(restored.currentSlug);
        setPublishedArticleSlug(
          restored.currentSlug && !restored.article.draft ? restored.currentSlug : undefined
        );
      } else {
        setArticle({ ...createInitialState(), ...restored });
      }
      setIsDirty(true);
      setMessage('端末から下書きを復元');
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    articleRef.current = article;
    if (!isDirty) {
      window.localStorage.removeItem(STORAGE_KEY);
      setDraftSavedAt(undefined);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ article, currentSlug }));
    } catch {
      setMessage('端末へ退避できませんでした');
      return;
    }
    const timeout = window.setTimeout(
      () =>
        setDraftSavedAt(
          new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        ),
      350
    );
    return () => window.clearTimeout(timeout);
  }, [article, currentSlug, isDirty]);

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
  const automaticThumbnailSubtitle = getThemesForTags(thumbnailTags)[0]?.name ?? siteConfig.name;
  const thumbnailSubtitle = thumbnailSubtitleOverride.trim() || automaticThumbnailSubtitle;
  const recommendedThumbnailPreset = recommendThumbnailPreset(article.title, thumbnailTags);
  const activeThumbnailPreset = THUMBNAIL_PRESETS.find(
    (preset) =>
      preset.layout === thumbnailLayout &&
      preset.variant === thumbnailVariant &&
      thumbnailMotif === 'native'
  )?.id;
  const thumbnailPreviewUrl = `/og?title=${encodeURIComponent(
    automaticSeo.seoTitle || article.title || '記事タイトル'
  )}&subtitle=${encodeURIComponent(thumbnailSubtitle)}&variant=${thumbnailVariant}&layout=${thumbnailLayout}&motif=${thumbnailMotif}&date=${article.createdAt}`;
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
  const filteredArticles = useMemo(() => {
    const query = articleQuery.trim().toLocaleLowerCase('ja');
    const scopedArticles = articles.filter((item) =>
      matchesArticlePickerMode(item, articlePickerMode)
    );
    if (['draft', 'idea', 'writing', 'review'].includes(articlePickerMode))
      scopedArticles.sort((first, second) => second.progress - first.progress);
    if (articlePickerMode === 'maintenance')
      scopedArticles.sort((first, second) => second.issues.length - first.issues.length);
    if (!query) return scopedArticles;
    return scopedArticles.filter((item) =>
      `${item.title} ${item.slug} ${item.description}`.toLocaleLowerCase('ja').includes(query)
    );
  }, [articlePickerMode, articleQuery, articles]);
  const filteredHints = useMemo(() => {
    const query = hintQuery.trim().toLocaleLowerCase('ja');
    if (!query) return noteHints;
    return noteHints.filter((note) =>
      `${note.title} ${note.target} ${note.excerpt}`.toLocaleLowerCase('ja').includes(query)
    );
  }, [hintQuery, noteHints]);
  const update = <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => {
    setArticle((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    if (key === 'body') {
      setLintMessages([]);
      setActiveLintIndex(null);
    }
    setMessage('ファイル未保存');
  };

  const changePublicationMode = (mode: PublicationMode) => {
    setArticle((current) => applyPublicationMode(current, mode, today));
    setIsDirty(true);
    setMessage('公開状態を変更した');
  };

  const generateThumbnail = async () => {
    if (!article.title.trim() || !article.slug.trim()) {
      setMessage('タイトルとスラッグを入力してください');
      return;
    }

    setIsGeneratingThumbnail(true);
    setMessage('サムネイルを生成中');
    try {
      const response = await fetch('/api/local-writer/thumbnail', {
        body: JSON.stringify({
          slug: article.slug,
          date: article.createdAt,
          subtitle: thumbnailSubtitle,
          title: automaticSeo.seoTitle || article.title,
          layout: thumbnailLayout,
          motif: thumbnailMotif,
          variant: thumbnailVariant,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      const result = (await response.json()) as {
        error?: string;
        eyecatch?: NonNullable<DraftState['eyecatch']>;
      };
      if (!response.ok || !result.eyecatch) {
        throw new Error(result.error ?? 'サムネイルを生成できませんでした');
      }

      update('eyecatch', {
        ...result.eyecatch,
        alt: `${article.title}のサムネイル画像`,
      });
      setMessage('サムネイルを生成した');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'サムネイルを生成できませんでした');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const runLint = async (openPanel = true): Promise<LintMessage[] | null> => {
    setIsLinting(true);
    const lintedBody = articleRef.current.body;
    try {
      const response = await fetch('/api/local-writer/lint', {
        body: JSON.stringify({ body: lintedBody }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      const result = (await response.json()) as { error?: string; messages?: LintMessage[] };
      if (!response.ok) throw new Error(result.error ?? '校正できませんでした');
      if (articleRef.current.body !== lintedBody) {
        setMessage('本文が変わったため、もう一度校正してください');
        return null;
      }
      const messages = result.messages ?? [];
      setLintMessages(messages);
      setActiveLintIndex(messages.length > 0 ? 0 : null);
      setLastLintedBody(lintedBody);
      if (openPanel) setSidePanel('review');
      setMessage(messages.length ? `${messages.length}件の指摘` : '校正: 問題なし');
      return messages;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '校正できませんでした');
      return null;
    } finally {
      setIsLinting(false);
    }
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setMessage('保存中');
    try {
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
      const savingArticle = JSON.stringify(article);
      const normalizedBody = normalizeWriterMarkdown(article.body);
      const affiliateLinksConverted = normalizedBody !== article.body;
      const preparedArticle = { ...article, ...automaticSeo, body: normalizedBody };
      const response = await fetch('/api/local-writer', {
        body: JSON.stringify({
          ...preparedArticle,
          overwrite: currentSlug === preparedArticle.slug,
          tags: preparedArticle.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      const result = (await response.json()) as {
        error?: string;
        path?: string;
        updatedAt?: string;
      };
      if (!response.ok) throw new Error(result.error ?? '保存できませんでした');
      setCurrentSlug(preparedArticle.slug);
      setPublishedArticleSlug(preparedArticle.draft ? undefined : preparedArticle.slug);
      if (JSON.stringify(articleRef.current) === savingArticle) {
        setArticle({ ...preparedArticle, updatedAt: result.updatedAt });
        if (lastLintedBody === article.body) setLastLintedBody(normalizedBody);
        window.localStorage.removeItem(STORAGE_KEY);
        setIsDirty(false);
        setMessage(
          affiliateLinksConverted
            ? '保存済み: AmazonリンクをアフィリエイトURLへ変換'
            : `保存済み: ${result.path}`
        );
      } else {
        setMessage('保存後に変更あり');
      }
      await loadArticleList();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存できませんでした');
    } finally {
      setIsSaving(false);
    }
  };

  const openArticle = async (slug: string) => {
    if (!slug) return;
    if (isDirty && !window.confirm('未保存の変更を破棄して別の記事を開く？')) return;
    const requestId = ++openRequestRef.current;
    const response = await fetch(`/api/local-writer?slug=${encodeURIComponent(slug)}`);
    const result = (await response.json()) as DraftState & { error?: string };
    if (requestId !== openRequestRef.current) return;
    if (!response.ok) return setMessage(result.error ?? '記事を開けませんでした');
    setArticle(result);
    setCurrentSlug(slug);
    setPublishedArticleSlug(result.draft ? undefined : slug);
    setIsArticlePickerOpen(false);
    setArticleQuery('');
    setIsDirty(false);
    setLintMessages([]);
    setLastLintedBody(undefined);
    setMessage('記事を開いた');
  };

  const newArticle = () => {
    if (isDirty && !window.confirm('未保存の変更を破棄して新しい記事を作る？')) return;
    openRequestRef.current += 1;
    setArticle(createInitialState());
    setCurrentSlug(undefined);
    setPublishedArticleSlug(undefined);
    setIsArticlePickerOpen(false);
    setArticleQuery('');
    setIsDirty(false);
    setLintMessages([]);
    setLastLintedBody(undefined);
    setMessage('新規記事');
  };

  const openHints = () => {
    setSidePanel('hints');
  };

  const closeArticlePicker = (restoreFocus = true) => {
    setIsArticlePickerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => articlePickerTriggerRef.current?.focus());
  };

  const trapArticlePickerFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])'
      ),
    ];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

  const insertAtCursor = (text: string, range?: { start: number; end: number }) => {
    const textarea = bodyRef.current;
    const start = range?.start ?? textarea?.selectionStart ?? articleRef.current.body.length;
    const end = range?.end ?? textarea?.selectionEnd ?? start;
    setArticle((current) => ({
      ...current,
      body: `${current.body.slice(0, start)}${text}${current.body.slice(end)}`,
    }));
    setIsDirty(true);
    setLintMessages([]);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const jumpToBodyOffset = (offset: number) => {
    const textarea = bodyRef.current;
    setViewMode('edit');
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(offset, offset);
      const before = articleRef.current.body.slice(0, offset);
      textarea?.scrollTo({ top: Math.max(0, before.split('\n').length * 28 - 120) });
    });
  };

  const jumpToLintMessage = (index: number) => {
    const item = lintMessages[index];
    const textarea = bodyRef.current;
    if (!item || !textarea) return;
    const [start, end] = item.range;
    setActiveLintIndex(index);
    setViewMode('edit');
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
      const line = articleRef.current.body.slice(0, start).split('\n').length - 1;
      const lineCount = Math.max(1, articleRef.current.body.split('\n').length - 1);
      const maxScroll = Math.max(0, textarea.scrollHeight - textarea.clientHeight);
      textarea.scrollTo({ behavior: 'smooth', top: (line / lineCount) * maxScroll });
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      selectionRef.current = { end, start };
    });
  };

  const applyMarkdownEdit = (edit: MarkdownEdit) => {
    setArticle((current) => ({ ...current, body: edit.value }));
    setIsDirty(true);
    setLintMessages([]);
    setActiveLintIndex(null);
    setMessage('ファイル未保存');
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
      selectionRef.current = { end: edit.selectionEnd, start: edit.selectionStart };
    });
  };

  const formatSelection = (format: 'bold' | 'code' | 'heading' | 'link' | 'quote') => {
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? selectionRef.current.start;
    const end = textarea?.selectionEnd ?? selectionRef.current.end;
    const value = articleRef.current.body;
    const edit =
      format === 'heading'
        ? prefixMarkdownLines(value, start, end, '## ')
        : format === 'quote'
          ? prefixMarkdownLines(value, start, end, '> ')
          : formatInlineMarkdown(value, start, end, format);
    applyMarkdownEdit(edit);
  };

  const uploadImage = async (file: File, purpose: 'body' | 'eyecatch' = 'body') => {
    if (!article.slug) {
      setSidePanel('settings');
      return setMessage('画像を追加する前に保存先を決めてください');
    }
    const uploadSlug = article.slug;
    const range = {
      start: bodyRef.current?.selectionStart ?? article.body.length,
      end: bodyRef.current?.selectionEnd ?? article.body.length,
    };
    const formData = new FormData();
    formData.set('image', file);
    formData.set('purpose', purpose);
    formData.set('slug', uploadSlug);
    setMessage(purpose === 'eyecatch' ? 'サムネイルを保存中' : '画像を保存中');
    try {
      const response = await fetch('/api/local-writer/images', { body: formData, method: 'POST' });
      const result = (await response.json()) as {
        error?: string;
        eyecatch?: NonNullable<DraftState['eyecatch']>;
        markdown?: string;
      };
      if (!response.ok) throw new Error(result.error ?? '画像を保存できませんでした');
      if (articleRef.current.slug !== uploadSlug) return setMessage('元の記事へ画像を保存しました');
      if (purpose === 'eyecatch') {
        if (!result.eyecatch) throw new Error('サムネイル情報を読み取れませんでした');
        update('eyecatch', result.eyecatch);
        setMessage('サムネイルを設定した');
      } else {
        if (!result.markdown) throw new Error('画像情報を読み取れませんでした');
        insertAtCursor(`\n${result.markdown}\n`, range);
        setMessage('画像を追加した');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '画像を保存できませんでした');
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    setIsDraggingHint(false);
    const noteTarget = event.dataTransfer.getData(OBSIDIAN_HINT_MIME);
    if (noteTarget) {
      insertAtCursor(`[[${noteTarget}]]`, selectionRef.current);
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

  useEffect(() => {
    if (!isArticlePickerOpen) return;
    requestAnimationFrame(() => articleSearchRef.current?.focus());
    const closePicker = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeArticlePicker();
    };
    window.addEventListener('keydown', closePicker);
    return () => window.removeEventListener('keydown', closePicker);
  }, [isArticlePickerOpen]);

  return (
    <div className={styles.shell}>
      <form className={styles.workspace} onSubmit={save}>
        <header className={styles.header}>
          <div className={styles.documentActions}>
            <button
              aria-expanded={isArticlePickerOpen}
              aria-haspopup="dialog"
              className={styles.articlePickerTrigger}
              onClick={() =>
                isArticlePickerOpen ? closeArticlePicker() : setIsArticlePickerOpen(true)
              }
              ref={articlePickerTriggerRef}
              type="button"
            >
              <span>{currentSlug ? article.title || currentSlug : '記事を開く'}</span>
              <ChevronDown />
            </button>
            <button
              aria-label="新規記事"
              className={styles.newArticleButton}
              onClick={newArticle}
              type="button"
            >
              <FilePlus2 />
            </button>
            {isArticlePickerOpen && (
              <>
                <button
                  aria-label="記事一覧を閉じる"
                  className={styles.articlePickerBackdrop}
                  onClick={() => closeArticlePicker()}
                  type="button"
                />
                <div
                  aria-label="記事を開く"
                  className={styles.articlePicker}
                  onKeyDown={trapArticlePickerFocus}
                  role="dialog"
                >
                  <label className={styles.articleSearch}>
                    <Search />
                    <input
                      aria-label="記事を検索"
                      onChange={(event) => setArticleQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          event.currentTarget
                            .closest(`.${styles.articlePicker}`)
                            ?.querySelector<HTMLButtonElement>(`[data-article-item]`)
                            ?.focus();
                        }
                      }}
                      placeholder="タイトル、スラッグ、説明で検索"
                      ref={articleSearchRef}
                      type="search"
                      value={articleQuery}
                    />
                  </label>
                  <div className={styles.articlePickerModes} aria-label="記事の分類">
                    {ARTICLE_PICKER_MODES.map(([mode, label]) => (
                      <button
                        aria-pressed={articlePickerMode === mode}
                        key={mode}
                        onClick={() => setArticlePickerMode(mode)}
                        type="button"
                      >
                        {label}
                        <span>
                          {articles.filter((item) => matchesArticlePickerMode(item, mode)).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className={styles.newArticleItem} onClick={newArticle} type="button">
                    <FilePlus2 />
                    <strong>新しい記事を書く</strong>
                  </button>
                  <div className={styles.articleList}>
                    <p className={styles.articleListHeading}>
                      <span>
                        {articleQuery ? '検索結果' : ARTICLE_PICKER_HEADINGS[articlePickerMode]}
                      </span>
                      <span>{filteredArticles.length}件</span>
                    </p>
                    {articlePickerMode === 'maintenance' && !articleQuery && (
                      <p className={styles.maintenanceGuide}>
                        公開後の記事を自動点検している。各項目は判定理由と、次に行う修正を示す。
                      </p>
                    )}
                    {filteredArticles.length === 0 && (
                      <p className={styles.emptyArticles}>条件に合う記事はない。</p>
                    )}
                    {filteredArticles.map((item) => (
                      <button
                        className={styles.articleItem}
                        data-article-item
                        key={item.slug}
                        onClick={() => void openArticle(item.slug)}
                        type="button"
                      >
                        <span className={styles.articleItemBody}>
                          <strong>{item.title || '無題の記事'}</strong>
                          {articlePickerMode === 'maintenance' ? (
                            <span className={styles.maintenanceIssues}>
                              {item.issues.map((issue) => (
                                <span className={styles.maintenanceIssue} key={issue}>
                                  <span className={styles.maintenanceIssueLabel}>
                                    {MAINTENANCE_LABELS[issue]}
                                  </span>
                                  <span>
                                    {item.issueDetails[issue]}. {MAINTENANCE_ACTIONS[issue]}。
                                  </span>
                                </span>
                              ))}
                            </span>
                          ) : (
                            <small>{item.description || item.slug}</small>
                          )}
                          {item.draft && articlePickerMode !== 'maintenance' && (
                            <span className={styles.articleProgress}>
                              <i style={{ width: `${item.progress}%` }} />
                            </span>
                          )}
                        </span>
                        <span className={styles.articleItemMeta}>
                          {item.draft && <span>{STAGE_LABELS[item.stage]}</span>}
                          {articlePickerMode === 'maintenance' && item.issues.length > 0 && (
                            <span>{item.issues.length}件</span>
                          )}
                          <time dateTime={item.updatedAt}>
                            {new Intl.DateTimeFormat('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                            }).format(new Date(item.updatedAt))}
                          </time>
                          {currentSlug === item.slug && <Check aria-label="現在の記事" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
            <input
              ref={eyecatchInputRef}
              accept="image/gif,image/jpeg,image/png,image/webp"
              className={styles.fileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file, 'eyecatch');
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
                  selectionRef.current = {
                    end: event.currentTarget.selectionEnd,
                    start: event.currentTarget.selectionStart,
                  };
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
                {isDraggingHint ? 'ここにノートを置く' : 'ここに画像を置く'}
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
          {sidePanel && !isDraggingHint && (
            <button
              aria-label="記事設定を閉じる"
              className={styles.drawerBackdrop}
              onClick={() => setSidePanel(null)}
              type="button"
            />
          )}
          <aside
            className={`${styles.inspector} ${sidePanel ? styles.inspectorOpen : ''}`}
            aria-label={
              sidePanel === 'review'
                ? '校正結果'
                : sidePanel === 'hints'
                  ? 'Obsidianのヒント'
                  : sidePanel === 'analysis'
                    ? '記事構成'
                    : '公開設定'
            }
            aria-hidden={!sidePanel}
            inert={!sidePanel}
          >
            <div className={styles.inspectorHeader}>
              <div className={styles.inspectorTabs} aria-label="執筆サイドバー">
                <button aria-pressed={sidePanel === 'hints'} onClick={openHints} type="button">
                  ノート
                </button>
                <button
                  aria-pressed={sidePanel === 'analysis'}
                  onClick={() => setSidePanel('analysis')}
                  type="button"
                >
                  構成
                </button>
                <button
                  aria-pressed={sidePanel === 'settings'}
                  onClick={() => setSidePanel('settings')}
                  type="button"
                >
                  公開設定
                </button>
                <button
                  aria-pressed={sidePanel === 'review'}
                  onClick={() => setSidePanel('review')}
                  type="button"
                >
                  校正{lintMessages.length > 0 ? ` ${lintMessages.length}` : ''}
                </button>
              </div>
              <button
                aria-label="記事設定を閉じる"
                onClick={() => setSidePanel(null)}
                type="button"
              >
                <X />
              </button>
            </div>
            {sidePanel === 'analysis' && (
              <div className={styles.analysisPanel}>
                <div className={styles.stageNavigator}>
                  {(
                    [
                      ['outline', '構成'],
                      ['draft', '執筆'],
                      ['review', '推敲'],
                      ['publish', '公開'],
                    ] as const
                  ).map(([stage, label]) => (
                    <button
                      aria-pressed={writingStage === stage}
                      key={stage}
                      onClick={() => {
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
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className={styles.analysisSummary}>
                  <div>
                    <strong>{writingAnalysis.readingMinutes}</strong>
                    <span>分で読める</span>
                  </div>
                  <dl>
                    <div>
                      <dt>段落</dt>
                      <dd>{writingAnalysis.paragraphCount}</dd>
                    </div>
                    <div>
                      <dt>見出し</dt>
                      <dd>{writingAnalysis.headings.length}</dd>
                    </div>
                    <div>
                      <dt>リンク</dt>
                      <dd>{writingAnalysis.internalLinks + writingAnalysis.externalLinks}</dd>
                    </div>
                    <div>
                      <dt>画像</dt>
                      <dd>{writingAnalysis.images}</dd>
                    </div>
                  </dl>
                </div>
                <section className={styles.analysisSection}>
                  <h2>次に直す</h2>
                  <div className={styles.findingList}>
                    {writingAnalysis.findings.map((finding) => {
                      const content = (
                        <>
                          <span data-type={finding.type} />
                          {finding.text}
                        </>
                      );
                      return finding.offset === undefined ? (
                        <p key={finding.text}>{content}</p>
                      ) : (
                        <button
                          key={finding.text}
                          onClick={() => jumpToBodyOffset(finding.offset ?? 0)}
                          type="button"
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section className={styles.analysisSection}>
                  <h2>見出し</h2>
                  {writingAnalysis.headings.length === 0 ? (
                    <p className={styles.analysisEmpty}>見出しを書くと、ここから移動できる。</p>
                  ) : (
                    <nav className={styles.outline} aria-label="記事の見出し">
                      {writingAnalysis.headings.map((heading) => (
                        <button
                          key={`${heading.offset}-${heading.text}`}
                          onClick={() => jumpToBodyOffset(heading.offset)}
                          style={{ paddingLeft: `${(heading.level - 2) * 0.7 + 0.2}rem` }}
                          type="button"
                        >
                          <span>H{heading.level}</span>
                          {heading.text}
                        </button>
                      ))}
                    </nav>
                  )}
                </section>
                <section className={styles.analysisSection}>
                  <h2>関連記事</h2>
                  {relatedArticles.length === 0 ? (
                    <p className={styles.analysisEmpty}>
                      タイトル・本文・タグが近い公開記事を自動で表示する。
                    </p>
                  ) : (
                    <div className={styles.relatedSuggestions}>
                      {relatedArticles.map((relatedArticle) => (
                        <button
                          key={relatedArticle.slug}
                          onClick={() => {
                            insertAtCursor(
                              `[${relatedArticle.title}](/blog/${relatedArticle.slug})`,
                              selectionRef.current
                            );
                            setMessage('関連記事へのリンクを追加した');
                          }}
                          type="button"
                        >
                          <strong>{relatedArticle.title}</strong>
                          <span>本文へリンクを追加</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
                <section className={styles.analysisSection}>
                  <h2>ブロックを追加</h2>
                  <div className={styles.blockButtons}>
                    {WRITING_BLOCKS.map((block) => (
                      <button
                        key={block.label}
                        onClick={() => {
                          insertAtCursor(block.text, selectionRef.current);
                          setMessage(`${block.label}ブロックを追加した`);
                        }}
                        type="button"
                      >
                        {block.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
            {sidePanel === 'review' && (
              <div className={styles.lintPanel}>
                <div className={styles.panelTitle}>
                  <div>
                    <strong>
                      {lintMessages.length > 0
                        ? `${lintMessages.length}件の気になる表現`
                        : '気になる表現はなかった'}
                    </strong>
                    <p>textlintとAI表現ルールで本文を確認する。</p>
                  </div>
                  <button disabled={isLinting} onClick={() => void runLint()} type="button">
                    {isLinting ? '確認中…' : 'もう一度確認'}
                  </button>
                </div>
                <div className={styles.lintList}>
                  {lintMessages.map((item, index) => {
                    const [start, end] = item.range;
                    const lineStart = article.body.lastIndexOf('\n', start - 1) + 1;
                    const lineEndIndex = article.body.indexOf('\n', end);
                    const lineEnd = lineEndIndex === -1 ? article.body.length : lineEndIndex;
                    const fix = item.fix;
                    return (
                      <article
                        className={styles.lintItem}
                        key={`${item.line}-${item.column}-${index}`}
                      >
                        <button
                          className={styles.lintJump}
                          onClick={() => jumpToLintMessage(index)}
                          type="button"
                        >
                          <span className={styles.lintLocation}>{item.line}行目</span>
                          <q>{article.body.slice(lineStart, lineEnd)}</q>
                        </button>
                        <p>{item.message}</p>
                        <footer>
                          <span className={styles.lintRule}>
                            <strong>{getLintCategory(item.ruleId)}</strong>
                            <code>{item.ruleId.split('/').at(-1)}</code>
                          </span>
                          {fix && (
                            <button
                              onClick={() => {
                                const [fixStart, fixEnd] = fix.range;
                                const nextBody = `${article.body.slice(0, fixStart)}${fix.text}${article.body.slice(fixEnd)}`;
                                applyMarkdownEdit({
                                  selectionEnd: fixStart + fix.text.length,
                                  selectionStart: fixStart + fix.text.length,
                                  value: nextBody,
                                });
                                setLintMessages((messages) =>
                                  messages.filter((_, i) => i !== index)
                                );
                              }}
                              type="button"
                            >
                              「{fix.text}」へ修正
                            </button>
                          )}
                          {item.suggestions?.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => {
                                const [fixStart, fixEnd] = suggestion.fix.range;
                                const nextBody = `${article.body.slice(0, fixStart)}${suggestion.fix.text}${article.body.slice(fixEnd)}`;
                                applyMarkdownEdit({
                                  selectionEnd: fixStart + suggestion.fix.text.length,
                                  selectionStart: fixStart + suggestion.fix.text.length,
                                  value: nextBody,
                                });
                              }}
                              type="button"
                            >
                              {suggestion.message}
                            </button>
                          ))}
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
            {sidePanel === 'hints' && (
              <div className={styles.hintsPanel}>
                <label className={styles.hintSearch}>
                  <Search />
                  <input
                    aria-label="非公開ノートを検索"
                    onChange={(event) => setHintQuery(event.target.value)}
                    placeholder="タイトルや本文から探す"
                    type="search"
                    value={hintQuery}
                  />
                </label>
                <p className={styles.hintGuide}>記事へドラッグすると、Obsidianリンクになる。</p>
                <div className={styles.hintList}>
                  {(!hasLoadedHints || isLoadingHints) && (
                    <p className={styles.emptyHints}>ノートを探しています…</p>
                  )}
                  {hasLoadedHints && !isLoadingHints && filteredHints.length === 0 && (
                    <p className={styles.emptyHints}>該当するノートはない。</p>
                  )}
                  {filteredHints.map((note) => (
                    <button
                      className={styles.hintItem}
                      draggable
                      key={note.target}
                      onClick={() => {
                        insertAtCursor(`[[${note.target}]]`, selectionRef.current);
                        setMessage('Obsidianノートへのリンクを追加した');
                      }}
                      onDragStart={(event) => {
                        setIsDraggingHint(true);
                        event.dataTransfer.effectAllowed = 'copy';
                        event.dataTransfer.setData(OBSIDIAN_HINT_MIME, note.target);
                        event.dataTransfer.setData('text/plain', `[[${note.target}]]`);
                      }}
                      onDragEnd={() => {
                        setIsDragging(false);
                        setIsDraggingHint(false);
                      }}
                      type="button"
                    >
                      <strong>{note.title}</strong>
                      {note.excerpt && <span>{note.excerpt}</span>}
                      <small>{note.target}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sidePanel === 'settings' && (
              <div>
                <h2>公開準備</h2>
                <div className={styles.readiness}>
                  <div>
                    <strong>
                      {publicationChecks.filter((item) => item.done).length}/
                      {publicationChecks.length}
                    </strong>
                    <span>項目を確認済み</span>
                  </div>
                  <ul>
                    {publicationChecks.map((item) => (
                      <li data-done={item.done} key={item.label}>
                        <Check />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={styles.preflightResult}
                  data-ready={preflight.blockers.length === 0}
                >
                  <strong>
                    {preflight.blockers.length > 0
                      ? `公開を止める問題が${preflight.blockers.length}件ある`
                      : preflight.warnings.length > 0
                        ? `公開可能。確認事項が${preflight.warnings.length}件ある`
                        : '公開準備が整っている'}
                  </strong>
                  {preflight.issues.length > 0 && (
                    <ul>
                      {preflight.issues.map((issue) => (
                        <li data-level={issue.level} key={issue.label}>
                          {issue.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            {sidePanel === 'settings' && (
              <div>
                <h2>サムネイル</h2>
                <div className={styles.thumbnailGenerator}>
                  <div className={styles.thumbnailPreview}>
                    <img alt="自動生成サムネイルのプレビュー" src={thumbnailPreviewUrl} />
                    <span>1200 × 630</span>
                  </div>
                  <fieldset className={styles.thumbnailPresets}>
                    <legend>記事に合うスタイル</legend>
                    <div>
                      {THUMBNAIL_PRESETS.map((preset) => (
                        <button
                          aria-pressed={activeThumbnailPreset === preset.id}
                          data-preset={preset.id}
                          key={preset.id}
                          onClick={() => {
                            setThumbnailLayout(preset.layout);
                            setThumbnailMotif('native');
                            setThumbnailVariant(preset.variant);
                          }}
                          type="button"
                        >
                          <span className={styles.presetVisual} aria-hidden="true" />
                          <span>
                            <strong>{preset.label}</strong>
                            <small>{preset.description}</small>
                          </span>
                          {recommendedThumbnailPreset === preset.id && <em>おすすめ</em>}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <details className={styles.thumbnailAdvanced}>
                    <summary>構図と配色を個別に調整</summary>
                    <fieldset className={styles.thumbnailChoices}>
                      <legend>構図</legend>
                      <div className={styles.thumbnailLayouts}>
                        {(
                          [
                            ['editorial', '余白'],
                            ['poster', '中央'],
                            ['split', '分割'],
                            ['frame', '囲み'],
                          ] as const
                        ).map(([layout, label]) => (
                          <button
                            aria-pressed={thumbnailLayout === layout}
                            data-layout={layout}
                            key={layout}
                            onClick={() => setThumbnailLayout(layout)}
                            type="button"
                          >
                            <span aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className={styles.thumbnailChoices}>
                      <legend>幾何模様</legend>
                      <div className={styles.thumbnailMotifs}>
                        {(
                          [
                            ['native', '構図固有'],
                            ['orbit', '軌道'],
                            ['grid', '格子'],
                            ['modules', '積木'],
                            ['rays', '放射'],
                          ] as const
                        ).map(([motif, label]) => (
                          <button
                            aria-pressed={thumbnailMotif === motif}
                            data-motif={motif}
                            key={motif}
                            onClick={() => setThumbnailMotif(motif)}
                            type="button"
                          >
                            <span aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className={styles.thumbnailChoices}>
                      <legend>配色</legend>
                      <div className={styles.thumbnailVariants}>
                        {(
                          [
                            ['paper', '生成り'],
                            ['sage', 'セージ'],
                            ['ink', '墨'],
                            ['indigo', '藍'],
                            ['plum', '梅'],
                          ] as const
                        ).map(([variant, label]) => (
                          <button
                            aria-pressed={thumbnailVariant === variant}
                            data-variant={variant}
                            key={variant}
                            onClick={() => setThumbnailVariant(variant)}
                            type="button"
                          >
                            <span aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </details>
                  <label className={styles.thumbnailSubtitle}>
                    <span>補助テキスト</span>
                    <input
                      maxLength={80}
                      onChange={(event) => setThumbnailSubtitleOverride(event.target.value)}
                      placeholder={automaticThumbnailSubtitle}
                      value={thumbnailSubtitleOverride}
                    />
                  </label>
                  <button
                    className={styles.generateThumbnailButton}
                    disabled={
                      isGeneratingThumbnail || !article.title.trim() || !article.slug.trim()
                    }
                    onClick={() => void generateThumbnail()}
                    type="button"
                  >
                    {isGeneratingThumbnail ? '生成中...' : 'このデザインで自動生成'}
                  </button>
                  <small>文字量に合わせて自動組版し、1200×630pxのPNGを記事へ保存する。</small>
                </div>
                <div className={styles.eyecatchField}>
                  {article.eyecatch ? (
                    <img
                      alt="記事のサムネイル"
                      src={
                        /^(?:https?:|\/|data:)/u.test(article.eyecatch.url)
                          ? article.eyecatch.url
                          : `/blog-assets/${article.slug}/${article.eyecatch.url}`
                      }
                    />
                  ) : (
                    <div className={styles.eyecatchEmpty}>
                      <ImagePlus />
                      <span>画像は未設定</span>
                    </div>
                  )}
                  <div>
                    <button onClick={() => eyecatchInputRef.current?.click()} type="button">
                      {article.eyecatch ? '画像を変更' : '画像を選ぶ'}
                    </button>
                    {article.eyecatch && (
                      <button onClick={() => update('eyecatch', null)} type="button">
                        削除
                      </button>
                    )}
                  </div>
                  {article.eyecatch && (
                    <label>
                      代替テキスト
                      <input
                        maxLength={160}
                        onChange={(event) => {
                          if (!article.eyecatch) return;
                          update('eyecatch', { ...article.eyecatch, alt: event.target.value });
                        }}
                        placeholder="画像の内容を簡潔に説明"
                        value={article.eyecatch.alt ?? ''}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            {sidePanel === 'settings' && (
              <div>
                <h2>保存先</h2>
                <label>
                  スラッグ
                  <input
                    disabled={Boolean(currentSlug)}
                    onChange={(event) => update('slug', event.target.value)}
                    placeholder="my-new-article"
                    value={article.slug}
                  />
                </label>
              </div>
            )}
            {sidePanel === 'settings' && (
              <div>
                <h2>公開状態</h2>
                <div className={styles.publicationModes} role="group" aria-label="公開状態">
                  {(
                    [
                      ['draft', '下書き', '検索・一覧へ出さない'],
                      ['published', '今すぐ公開', '保存後すぐ公開対象'],
                      ['scheduled', '予約公開', '指定日まで非公開'],
                    ] as const
                  ).map(([mode, label, description]) => (
                    <button
                      aria-pressed={publicationMode === mode}
                      key={mode}
                      onClick={() => changePublicationMode(mode)}
                      type="button"
                    >
                      <strong>{label}</strong>
                      <span>{description}</span>
                    </button>
                  ))}
                </div>
                <label>
                  {publicationMode === 'scheduled' ? '公開予定日' : '公開日'}
                  <input
                    min={publicationMode === 'scheduled' ? today : undefined}
                    onChange={(event) => update('createdAt', event.target.value)}
                    type="date"
                    value={article.createdAt}
                  />
                  <small>
                    {publicationMode === 'scheduled'
                      ? `${article.createdAt}の00:00 UTC以降に公開対象になる。`
                      : '初回公開日として記事と構造化データへ表示する。'}
                  </small>
                </label>
                {article.updatedAt && (
                  <div className={styles.metadataRow}>
                    <span>最終更新</span>
                    <time dateTime={article.updatedAt}>
                      {new Intl.DateTimeFormat('ja-JP', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(article.updatedAt))}
                    </time>
                  </div>
                )}
                <div className={styles.publicationSummary} data-mode={publicationMode}>
                  <strong>
                    {publicationMode === 'draft'
                      ? '非公開の下書き'
                      : publicationMode === 'scheduled'
                        ? `${article.createdAt}に公開予定`
                        : '公開対象の記事'}
                  </strong>
                  <span>
                    {article.noindex || publicationMode !== 'published'
                      ? '検索エンジンへは登録しない'
                      : '検索エンジンへ登録できる'}
                  </span>
                </div>
              </div>
            )}
            {sidePanel === 'settings' && (
              <div>
                <h2>記事情報</h2>
                <label>
                  タグ
                  <input
                    onChange={(event) => update('tags', event.target.value)}
                    placeholder="Next.js, ブログ"
                    value={article.tags}
                  />
                </label>
                <label>
                  説明
                  <textarea
                    maxLength={240}
                    onChange={(event) => update('description', event.target.value)}
                    placeholder="一覧と検索結果に表示する説明"
                    rows={4}
                    value={article.description}
                  />
                  <small data-state={descriptionState}>
                    {automaticSeo.description.length}/160文字目安
                    {descriptionState === 'short' && '・検索結果には短め'}
                    {descriptionState === 'good' && '・適切な長さ'}
                    {descriptionState === 'long' && '・検索結果では省略される可能性'}
                  </small>
                </label>
              </div>
            )}
            {sidePanel === 'settings' && (
              <details className={styles.advancedSettings}>
                <summary>検索と共有の詳細</summary>
                <div className={styles.advancedSettingsBody}>
                  <div className={styles.autoSeoIntro}>
                    <p>空欄はタイトルと本文から保存時に自動設定する。</p>
                    <button
                      onClick={() => {
                        setArticle((current) => ({ ...current, ...createAutomaticSeo(current) }));
                        setIsDirty(true);
                        setMessage('SEO設定を自動入力した');
                      }}
                      type="button"
                    >
                      自動設定を反映
                    </button>
                  </div>
                  <label>
                    SEOタイトル
                    <input
                      maxLength={60}
                      onChange={(event) => update('seoTitle', event.target.value)}
                      placeholder={automaticSeo.seoTitle || '記事タイトルから自動設定'}
                      value={article.seoTitle}
                    />
                    <small data-state={seoTitleState}>
                      {automaticSeo.seoTitle.length}/60文字
                      {seoTitleState === 'short' && '・やや短い'}
                      {seoTitleState === 'good' && '・適切な長さ'}
                    </small>
                  </label>
                  <label>
                    canonical URL
                    <input
                      inputMode="url"
                      onChange={(event) => update('canonicalUrl', event.target.value)}
                      placeholder={`${siteConfig.url}/blog/${article.slug || 'article-slug'}`}
                      type="url"
                      value={article.canonicalUrl}
                    />
                    <small>
                      空欄なら {siteConfig.url}/blog/{article.slug || 'article-slug'} を使用する。
                    </small>
                  </label>
                  <label className={styles.toggle}>
                    <input
                      checked={article.noindex}
                      onChange={(event) => update('noindex', event.target.checked)}
                      type="checkbox"
                    />
                    公開後も検索結果に表示しない
                  </label>
                  {(publicationMode !== 'published' || article.noindex) && (
                    <p className={styles.automaticNoindex}>
                      {article.noindex
                        ? '明示的にnoindexを設定している。'
                        : '下書き・予約投稿は公開対象にならない。'}
                    </p>
                  )}
                  <div className={styles.publicUrlPreview}>
                    <span>最終URL</span>
                    <code>{publicUrl}</code>
                    {article.canonicalUrl && (
                      <small>このブログのURLではなく、canonical URLを正規URLとして扱う。</small>
                    )}
                  </div>
                  <div className={styles.searchPreview}>
                    <span>{publicUrl.replace(/^https?:\/\//u, '')}</span>
                    <strong>{automaticSeo.seoTitle || '記事タイトル'}</strong>
                    <p>{automaticSeo.description || '本文を書くと説明を自動生成する。'}</p>
                  </div>
                </div>
              </details>
            )}
          </aside>
        </main>
      </form>
    </div>
  );
}
