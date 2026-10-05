'use client';

import { type RefObject, useCallback, useState } from 'react';
import type { DraftState, LintMessage } from './writer-model';

interface UseWriterLintOptions {
  articleRef: RefObject<DraftState>;
  onOpenReview: () => void;
  setMessage: (message: string) => void;
}

export const useWriterLint = ({ articleRef, onOpenReview, setMessage }: UseWriterLintOptions) => {
  const [isLinting, setIsLinting] = useState(false);
  const [lintMessages, setLintMessages] = useState<LintMessage[]>([]);
  const [activeLintIndex, setActiveLintIndex] = useState<number | null>(null);
  const [lastLintedBody, setLastLintedBody] = useState<string>();

  const clearLint = useCallback(() => {
    setLintMessages([]);
    setActiveLintIndex(null);
  }, []);

  const resetLint = useCallback(() => {
    clearLint();
    setLastLintedBody(undefined);
  }, [clearLint]);

  const dismissLint = useCallback((index: number) => {
    setLintMessages((messages) => messages.filter((_, messageIndex) => messageIndex !== index));
  }, []);

  const runLint = useCallback(
    async (openPanel = true): Promise<LintMessage[] | null> => {
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
        if (openPanel) onOpenReview();
        setMessage(messages.length ? `${messages.length}件の指摘` : '校正: 問題なし');
        return messages;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '校正できませんでした');
        return null;
      } finally {
        setIsLinting(false);
      }
    },
    [articleRef, onOpenReview, setMessage]
  );

  return {
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
  };
};
