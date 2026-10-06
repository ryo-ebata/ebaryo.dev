'use client';

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { SidePanel, VisibleSidePanel } from './writer-model';

interface UseWriterLifecycleOptions {
  isDirty: boolean;
  onSave: () => void;
  setSidePanel: Dispatch<SetStateAction<SidePanel>>;
  sidePanel: SidePanel;
}

export const useWriterLifecycle = ({
  isDirty,
  onSave,
  setSidePanel,
  sidePanel,
}: UseWriterLifecycleOptions) => {
  const onSaveRef = useRef(onSave);
  const lastSidePanelRef = useRef<VisibleSidePanel>('hints');
  onSaveRef.current = onSave;
  if (sidePanel) lastSidePanelRef.current = sidePanel;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 's') {
        event.preventDefault();
        onSaveRef.current();
        return;
      }
      if (event.key === 'Escape') setSidePanel(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidePanel]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return useCallback(
    () => setSidePanel((current) => (current ? null : lastSidePanelRef.current)),
    [setSidePanel]
  );
};
