import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './writer-model';
import { useWriterImages } from './use-writer-images';

describe('useWriterImages', () => {
  it('本文画像のMarkdownを指定位置へ挿入する', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ markdown: '![画像](./image.png)' }),
          ok: true,
        } as Response)
      )
    );
    const article = { ...createInitialState(), slug: 'article' };
    const insertMarkdown = vi.fn();
    const setMessage = vi.fn();
    const { result } = renderHook(() =>
      useWriterImages({
        article,
        articleRef: { current: article },
        insertMarkdown,
        onEyecatch: vi.fn(),
        onMissingSlug: vi.fn(),
        setMessage,
      })
    );
    const file = new File(['image'], 'image.png', { type: 'image/png' });

    await act(() => result.current.uploadImage(file, 'body', { end: 4, start: 4 }));

    expect(insertMarkdown).toHaveBeenCalledWith('\n![画像](./image.png)\n', {
      end: 4,
      start: 4,
    });
    expect(setMessage).toHaveBeenLastCalledWith('画像を追加した');
  });

  it('スラッグ未設定ならアップロードせず設定画面を開く', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const article = createInitialState();
    const onMissingSlug = vi.fn();
    const setMessage = vi.fn();
    const { result } = renderHook(() =>
      useWriterImages({
        article,
        articleRef: { current: article },
        insertMarkdown: vi.fn(),
        onEyecatch: vi.fn(),
        onMissingSlug,
        setMessage,
      })
    );

    await act(() =>
      result.current.uploadImage(new File(['image'], 'image.png'), 'body', { end: 0, start: 0 })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onMissingSlug).toHaveBeenCalledOnce();
    expect(setMessage).toHaveBeenLastCalledWith('画像を追加する前に保存先を決めてください');
  });

  it('サムネ生成APIが空のエラーを返しても読み取り例外を表示しない', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 500 })))
    );
    const article = { ...createInitialState(), slug: 'article', title: '記事タイトル' };
    const setMessage = vi.fn();
    const { result } = renderHook(() =>
      useWriterImages({
        article,
        articleRef: { current: article },
        insertMarkdown: vi.fn(),
        onEyecatch: vi.fn(),
        onMissingSlug: vi.fn(),
        setMessage,
      })
    );

    await act(() =>
      result.current.generateThumbnail({
        date: '2026-10-05',
        layout: 'editorial',
        motif: 'native',
        subtitle: 'ebaryo.dev',
        title: article.title,
        variant: 'paper',
      })
    );

    expect(setMessage).toHaveBeenLastCalledWith('サムネイルを生成できませんでした');
  });
});
