'use client';

import { useEffect, useState } from 'react';
import { parseApiResponse } from '@/lib/client-api';
import type { NoteHint, SidePanel } from './writer-model';

export const useWriterHints = (sidePanel: SidePanel, setMessage: (message: string) => void) => {
  const [noteHints, setNoteHints] = useState<NoteHint[]>([]);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [hasLoadedHints, setHasLoadedHints] = useState(false);

  useEffect(() => {
    if (sidePanel !== 'hints' || hasLoadedHints || isLoadingHints) return;

    const loadHints = async () => {
      setIsLoadingHints(true);
      try {
        const response = await fetch('/api/local-writer/hints');
        const result = await parseApiResponse<{ notes?: NoteHint[] }>(
          response,
          'ヒントを読み込めませんでした'
        );
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

  return { hasLoadedHints, isLoadingHints, noteHints };
};
