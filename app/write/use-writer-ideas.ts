'use client';

import { useEffect, useState } from 'react';
import { parseApiResponse } from '@/lib/client-api';
import type { SidePanel, WriterIdea } from './writer-model';

export const useWriterIdeas = (sidePanel: SidePanel, setMessage: (message: string) => void) => {
  const [ideas, setIdeas] = useState<WriterIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [hasLoadedIdeas, setHasLoadedIdeas] = useState(false);

  useEffect(() => {
    if (sidePanel !== 'ideas' || hasLoadedIdeas || isLoadingIdeas) return;
    const loadIdeas = async () => {
      setIsLoadingIdeas(true);
      try {
        const response = await fetch('/api/local-writer/ideas');
        const result = await parseApiResponse<{ ideas?: WriterIdea[] }>(
          response,
          '記事案を作れませんでした'
        );
        setIdeas(result.ideas ?? []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '記事案を作れませんでした');
      } finally {
        setIsLoadingIdeas(false);
        setHasLoadedIdeas(true);
      }
    };
    void loadIdeas();
  }, [hasLoadedIdeas, isLoadingIdeas, setMessage, sidePanel]);

  return { hasLoadedIdeas, ideas, isLoadingIdeas };
};
