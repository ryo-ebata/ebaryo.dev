import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, STORAGE_KEY } from './writer-model';
import { useWriterDocument } from './use-writer-document';

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({ json: () => Promise.resolve(body), ok }) as Promise<Response>;

describe('useWriterDocument', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('端末に退避した下書きを復元する', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        article: { ...createInitialState(), body: '復元本文', slug: 'restored', title: '復元記事' },
        currentSlug: 'restored',
      })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ articles: [] }))
    );

    const { result } = renderHook(() => useWriterDocument());

    await waitFor(() => expect(result.current.article.title).toBe('復元記事'));
    expect(result.current.currentSlug).toBe('restored');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.message).toBe('端末から下書きを復元');
  });

  it('保存成功後に文書状態と一覧を更新する', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ articles: [] }))
      .mockImplementationOnce(() =>
        jsonResponse({
          path: 'blog-obsidian/public/blogs/new-post/index.md',
          updatedAt: '2026-10-05',
        })
      )
      .mockImplementationOnce(() => jsonResponse({ articles: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWriterDocument());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const article = {
      ...createInitialState(),
      body: '本文',
      slug: 'new-post',
      title: '新規記事',
    };
    act(() => result.current.updateArticle('title', article.title));
    act(() => result.current.updateArticle('slug', article.slug));
    act(() => result.current.updateArticle('body', article.body));

    await act(() =>
      result.current.saveDocument({
        article,
        message: (path) => `保存済み: ${path}`,
      })
    );

    expect(result.current.currentSlug).toBe('new-post');
    expect(result.current.article.updatedAt).toBe('2026-10-05');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.message).toContain('保存済み');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('未保存時は確認後に新規文書へ切り替える', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ articles: [] }))
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDocumentReplaced = vi.fn();
    const { result } = renderHook(() => useWriterDocument({ onDocumentReplaced }));

    act(() => result.current.updateArticle('title', '編集中'));
    act(() => result.current.newArticle());

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(result.current.article.title).toBe('');
    expect(result.current.isDirty).toBe(false);
    expect(onDocumentReplaced).toHaveBeenCalledOnce();
  });
});
