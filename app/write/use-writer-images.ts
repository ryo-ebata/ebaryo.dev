'use client';

import { type RefObject, useCallback, useState } from 'react';
import type { ThumbnailLayout, ThumbnailMotif, ThumbnailVariant } from '@/lib/og/og-params';
import type { DraftState } from './writer-model';

interface TextRange {
  end: number;
  start: number;
}

interface ThumbnailOptions {
  date: string;
  layout: ThumbnailLayout;
  motif: ThumbnailMotif;
  subtitle: string;
  title: string;
  variant: ThumbnailVariant;
}

interface UseWriterImagesOptions {
  article: DraftState;
  articleRef: RefObject<DraftState>;
  insertMarkdown: (markdown: string, range: TextRange) => void;
  onEyecatch: (eyecatch: NonNullable<DraftState['eyecatch']>) => void;
  onMissingSlug: () => void;
  setMessage: (message: string) => void;
}

export const useWriterImages = ({
  article,
  articleRef,
  insertMarkdown,
  onEyecatch,
  onMissingSlug,
  setMessage,
}: UseWriterImagesOptions) => {
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  const generateThumbnail = useCallback(
    async ({ date, layout, motif, subtitle, title, variant }: ThumbnailOptions) => {
      if (!article.title.trim() || !article.slug.trim()) {
        setMessage('タイトルとスラッグを入力してください');
        return false;
      }

      setIsGeneratingThumbnail(true);
      setMessage('サムネイルを生成中');
      try {
        const response = await fetch('/api/local-writer/thumbnail', {
          body: JSON.stringify({
            date,
            layout,
            motif,
            slug: article.slug,
            subtitle,
            title,
            variant,
          }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        });
        const responseText = await response.text();
        let result: {
          error?: string;
          eyecatch?: NonNullable<DraftState['eyecatch']>;
        } = {};
        if (responseText) {
          try {
            result = JSON.parse(responseText) as typeof result;
          } catch {
            throw new Error(
              response.ok
                ? 'サムネイル生成結果を読み取れませんでした'
                : `サムネイルを生成できませんでした (${response.status})`
            );
          }
        }
        if (!response.ok || !result.eyecatch) {
          throw new Error(result.error ?? 'サムネイルを生成できませんでした');
        }
        onEyecatch({ ...result.eyecatch, alt: `${article.title}のサムネイル画像` });
        setMessage('サムネイルを生成した');
        return true;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'サムネイルを生成できませんでした');
        return false;
      } finally {
        setIsGeneratingThumbnail(false);
      }
    },
    [article.slug, article.title, onEyecatch, setMessage]
  );

  const uploadImage = useCallback(
    async (file: File, purpose: 'body' | 'eyecatch', range: TextRange) => {
      if (!article.slug) {
        onMissingSlug();
        setMessage('画像を追加する前に保存先を決めてください');
        return false;
      }
      const uploadSlug = article.slug;
      const formData = new FormData();
      formData.set('image', file);
      formData.set('purpose', purpose);
      formData.set('slug', uploadSlug);
      setMessage(purpose === 'eyecatch' ? 'サムネイルを保存中' : '画像を保存中');
      try {
        const response = await fetch('/api/local-writer/images', {
          body: formData,
          method: 'POST',
        });
        const result = (await response.json()) as {
          error?: string;
          eyecatch?: NonNullable<DraftState['eyecatch']>;
          markdown?: string;
        };
        if (!response.ok) throw new Error(result.error ?? '画像を保存できませんでした');
        if (articleRef.current.slug !== uploadSlug) {
          setMessage('元の記事へ画像を保存しました');
          return false;
        }
        if (purpose === 'eyecatch') {
          if (!result.eyecatch) throw new Error('サムネイル情報を読み取れませんでした');
          onEyecatch(result.eyecatch);
          setMessage('サムネイルを設定した');
        } else {
          if (!result.markdown) throw new Error('画像情報を読み取れませんでした');
          insertMarkdown(`\n${result.markdown}\n`, range);
          setMessage('画像を追加した');
        }
        return true;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '画像を保存できませんでした');
        return false;
      }
    },
    [article.slug, articleRef, insertMarkdown, onEyecatch, onMissingSlug, setMessage]
  );

  return { generateThumbnail, isGeneratingThumbnail, uploadImage };
};
