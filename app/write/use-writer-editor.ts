'use client';

import { type Dispatch, type RefObject, type SetStateAction, useRef } from 'react';
import { formatInlineMarkdown, prefixMarkdownLines, type MarkdownEdit } from '@/lib/writer-editing';
import type { DraftState, LintMessage, ViewMode } from './writer-model';

interface TextRange {
  end: number;
  start: number;
}

interface UseWriterEditorOptions {
  articleRef: RefObject<DraftState>;
  clearLint: () => void;
  lintMessages: LintMessage[];
  setActiveLintIndex: Dispatch<SetStateAction<number | null>>;
  setArticle: Dispatch<SetStateAction<DraftState>>;
  setIsDirty: Dispatch<SetStateAction<boolean>>;
  setMessage: (message: string) => void;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

export const useWriterEditor = ({
  articleRef,
  clearLint,
  lintMessages,
  setActiveLintIndex,
  setArticle,
  setIsDirty,
  setMessage,
  setViewMode,
}: UseWriterEditorOptions) => {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<TextRange>({ end: 0, start: 0 });

  const rememberSelection = (range: TextRange) => {
    selectionRef.current = range;
  };

  const getSelectionRange = (): TextRange => ({
    end: bodyRef.current?.selectionEnd ?? articleRef.current.body.length,
    start: bodyRef.current?.selectionStart ?? articleRef.current.body.length,
  });

  const insertAtCursor = (text: string, range = getSelectionRange()) => {
    const { end, start } = range;
    setArticle((current) => ({
      ...current,
      body: `${current.body.slice(0, start)}${text}${current.body.slice(end)}`,
    }));
    setIsDirty(true);
    clearLint();
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const jumpToBodyOffset = (offset: number) => {
    setViewMode('edit');
    requestAnimationFrame(() => {
      const textarea = bodyRef.current;
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
    clearLint();
    setMessage('ファイル未保存');
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
      selectionRef.current = { end: edit.selectionEnd, start: edit.selectionStart };
    });
  };

  const formatSelection = (format: 'bold' | 'code' | 'heading' | 'link' | 'quote') => {
    const { end, start } = getSelectionRange();
    const value = articleRef.current.body;
    const edit =
      format === 'heading'
        ? prefixMarkdownLines(value, start, end, '## ')
        : format === 'quote'
          ? prefixMarkdownLines(value, start, end, '> ')
          : formatInlineMarkdown(value, start, end, format);
    applyMarkdownEdit(edit);
  };

  return {
    applyMarkdownEdit,
    bodyRef,
    formatSelection,
    getSelectionRange,
    insertAtCursor,
    jumpToBodyOffset,
    jumpToLintMessage,
    rememberSelection,
    selectionRef,
  };
};
