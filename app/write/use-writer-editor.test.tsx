import { act, renderHook } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState, type ViewMode } from './writer-model';
import { useWriterEditor } from './use-writer-editor';

const useEditorHarness = () => {
  const [article, setArticle] = useState({ ...createInitialState(), body: '前後' });
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const articleRef = useRef(article);
  articleRef.current = article;
  const editor = useWriterEditor({
    articleRef,
    clearLint: vi.fn(),
    lintMessages: [],
    setActiveLintIndex: vi.fn(),
    setArticle,
    setIsDirty,
    setMessage: vi.fn(),
    setViewMode,
  });
  return { article, editor, isDirty, viewMode };
};

describe('useWriterEditor', () => {
  it('指定した選択範囲へ文字列を挿入する', () => {
    const { result } = renderHook(useEditorHarness);

    act(() => result.current.editor.insertAtCursor('中', { end: 1, start: 1 }));

    expect(result.current.article.body).toBe('前中後');
    expect(result.current.isDirty).toBe(true);
  });

  it('textareaの現在選択範囲を取得する', () => {
    const { result } = renderHook(useEditorHarness);
    const textarea = document.createElement('textarea');
    textarea.value = '前後';
    textarea.setSelectionRange(0, 1);
    result.current.editor.bodyRef.current = textarea;

    expect(result.current.editor.getSelectionRange()).toEqual({ end: 1, start: 0 });
  });
});
