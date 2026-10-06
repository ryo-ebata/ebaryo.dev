import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { SidePanel } from './writer-model';
import { useWriterLifecycle } from './use-writer-lifecycle';

describe('useWriterLifecycle', () => {
  it('保存ショートカットと直前のサイドパネル復元を扱う', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => {
      const [sidePanel, setSidePanel] = useState<SidePanel>('analysis');
      const toggleSidebar = useWriterLifecycle({
        isDirty: false,
        onSave,
        setSidePanel,
        sidePanel,
      });
      return { sidePanel, toggleSidebar };
    });

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true })));
    expect(onSave).toHaveBeenCalledOnce();

    act(() => result.current.toggleSidebar());
    expect(result.current.sidePanel).toBeNull();
    act(() => result.current.toggleSidebar());
    expect(result.current.sidePanel).toBe('analysis');
  });

  it('Escapeでサイドパネルを閉じる', () => {
    const { result } = renderHook(() => {
      const [sidePanel, setSidePanel] = useState<SidePanel>('settings');
      useWriterLifecycle({ isDirty: false, onSave: vi.fn(), setSidePanel, sidePanel });
      return sidePanel;
    });

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(result.current).toBeNull();
  });
});
