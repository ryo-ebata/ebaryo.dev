'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ArticleSummary,
  createInitialState,
  type DraftState,
  normalizeWriterDate,
  STORAGE_KEY,
} from './writer-model';

interface SaveDocumentOptions {
  article: DraftState;
  message: (path?: string) => string;
  onSaved?: (savedArticle: DraftState) => void;
}

interface UseWriterDocumentOptions {
  onDocumentReplaced?: () => void;
}

export const useWriterDocument = ({ onDocumentReplaced }: UseWriterDocumentOptions = {}) => {
  const [article, setArticle] = useState(createInitialState);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string>();
  const [publishedArticleSlug, setPublishedArticleSlug] = useState<string>();
  const [message, setMessage] = useState('未保存');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string>();
  const articleRef = useRef(article);
  const openRequestRef = useRef(0);
  const onDocumentReplacedRef = useRef(onDocumentReplaced);
  onDocumentReplacedRef.current = onDocumentReplaced;

  const loadArticleList = useCallback(async () => {
    const response = await fetch('/api/local-writer');
    if (!response.ok) return;
    setArticles(((await response.json()) as { articles: ArticleSummary[] }).articles);
  }, []);

  useEffect(() => {
    void loadArticleList();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const restored = JSON.parse(saved) as
        | DraftState
        | { article: DraftState; currentSlug?: string };
      if ('article' in restored) {
        setArticle({
          ...createInitialState(),
          ...restored.article,
          createdAt: normalizeWriterDate(restored.article.createdAt),
        });
        setCurrentSlug(restored.currentSlug);
        setPublishedArticleSlug(
          restored.currentSlug && !restored.article.draft ? restored.currentSlug : undefined
        );
      } else {
        setArticle({
          ...createInitialState(),
          ...restored,
          createdAt: normalizeWriterDate(restored.createdAt),
        });
      }
      setIsDirty(true);
      setMessage('端末から下書きを復元');
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [loadArticleList]);

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

  const updateArticle = useCallback(
    <Key extends keyof DraftState>(key: Key, value: DraftState[Key]) => {
      setArticle((current) => ({ ...current, [key]: value }));
      setIsDirty(true);
      setMessage('ファイル未保存');
    },
    []
  );

  const openArticle = useCallback(
    async (slug: string) => {
      if (!slug) return false;
      if (isDirty && !window.confirm('未保存の変更を破棄して別の記事を開く？')) return false;
      const requestId = ++openRequestRef.current;
      const response = await fetch(`/api/local-writer?slug=${encodeURIComponent(slug)}`);
      const result = (await response.json()) as DraftState & { error?: string };
      if (requestId !== openRequestRef.current) return false;
      if (!response.ok) {
        setMessage(result.error ?? '記事を開けませんでした');
        return false;
      }
      setArticle(result);
      setCurrentSlug(slug);
      setPublishedArticleSlug(result.draft ? undefined : slug);
      setIsDirty(false);
      setMessage('記事を開いた');
      onDocumentReplacedRef.current?.();
      return true;
    },
    [isDirty]
  );

  const newArticle = useCallback(() => {
    if (isDirty && !window.confirm('未保存の変更を破棄して新しい記事を作る？')) return false;
    openRequestRef.current += 1;
    setArticle(createInitialState());
    setCurrentSlug(undefined);
    setPublishedArticleSlug(undefined);
    setIsDirty(false);
    setMessage('新規記事');
    onDocumentReplacedRef.current?.();
    return true;
  }, [isDirty]);

  const saveDocument = useCallback(
    async ({ article: preparedArticle, message: createMessage, onSaved }: SaveDocumentOptions) => {
      if (isSaving) return false;
      setIsSaving(true);
      setMessage('保存中');
      try {
        const savingArticle = JSON.stringify(articleRef.current);
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
        const savedArticle = { ...preparedArticle, updatedAt: result.updatedAt };
        setCurrentSlug(preparedArticle.slug);
        setPublishedArticleSlug(preparedArticle.draft ? undefined : preparedArticle.slug);
        if (JSON.stringify(articleRef.current) === savingArticle) {
          setArticle(savedArticle);
          window.localStorage.removeItem(STORAGE_KEY);
          setIsDirty(false);
          setMessage(createMessage(result.path));
          onSaved?.(savedArticle);
        } else {
          setMessage('保存後に変更あり');
        }
        await loadArticleList();
        return true;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '保存できませんでした');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [currentSlug, isSaving, loadArticleList]
  );

  return {
    article,
    articleRef,
    articles,
    currentSlug,
    draftSavedAt,
    isDirty,
    isSaving,
    message,
    newArticle,
    openArticle,
    publishedArticleSlug,
    saveDocument,
    setArticle,
    setIsDirty,
    setMessage,
    updateArticle,
  };
};
