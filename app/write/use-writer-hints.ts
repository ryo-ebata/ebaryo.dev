'use client';

import { useEffect, useState } from 'react';
import { parseApiResponse } from '@/lib/client-api';
import type { NoteHint, SidePanel, WriterSourceHint } from './writer-model';

export const useWriterHints = (sidePanel: SidePanel, setMessage: (message: string) => void) => {
  const [noteHints, setNoteHints] = useState<NoteHint[]>([]);
  const [clippingHints, setClippingHints] = useState<WriterSourceHint[]>([]);
  const [kindleHints, setKindleHints] = useState<WriterSourceHint[]>([]);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [hasLoadedHints, setHasLoadedHints] = useState(false);

  useEffect(() => {
    if (
      !sidePanel ||
      !['clippings', 'facts', 'hints', 'kindle'].includes(sidePanel) ||
      hasLoadedHints ||
      isLoadingHints
    ) {
      return;
    }

    const loadHints = async () => {
      setIsLoadingHints(true);
      try {
        const response = await fetch('/api/local-writer/hints');
        const result = await parseApiResponse<{
          clippings?: WriterSourceHint[];
          kindleBooks?: WriterSourceHint[];
          notes?: NoteHint[];
        }>(response, 'ヒントを読み込めませんでした');
        setClippingHints(result.clippings ?? []);
        setKindleHints(result.kindleBooks ?? []);
        setNoteHints(result.notes ?? []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'ヒントを読み込めませんでした');
      } finally {
        setIsLoadingHints(false);
        setHasLoadedHints(true);
      }
    };

    void loadHints();
  }, [hasLoadedHints, isLoadingHints, setMessage, sidePanel]);

  return { clippingHints, hasLoadedHints, isLoadingHints, kindleHints, noteHints };
};
