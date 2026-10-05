import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './writer-model';
import { useWriterLint } from './use-writer-lint';

const lintMessage = {
  column: 1,
  line: 1,
  message: '冗長な表現',
  range: [0, 2] as [number, number],
  ruleId: 'test-rule',
  severity: 2,
};

describe('useWriterLint', () => {
  it('校正結果を保持してレビューを開く', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ messages: [lintMessage] }),
          ok: true,
        } as Response)
      )
    );
    const articleRef = { current: { ...createInitialState(), body: '本文' } };
    const onOpenReview = vi.fn();
    const setMessage = vi.fn();
    const { result } = renderHook(() => useWriterLint({ articleRef, onOpenReview, setMessage }));

    await act(() => result.current.runLint());

    expect(result.current.lintMessages).toEqual([lintMessage]);
    expect(result.current.activeLintIndex).toBe(0);
    expect(result.current.lastLintedBody).toBe('本文');
    expect(onOpenReview).toHaveBeenCalledOnce();
    expect(setMessage).toHaveBeenLastCalledWith('1件の指摘');
  });

  it('校正中に本文が変わった結果を破棄する', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          })
      )
    );
    const articleRef = { current: { ...createInitialState(), body: '校正前' } };
    const setMessage = vi.fn();
    const { result } = renderHook(() =>
      useWriterLint({ articleRef, onOpenReview: vi.fn(), setMessage })
    );

    let lintResult: unknown;
    await act(async () => {
      const request = result.current.runLint();
      articleRef.current = { ...articleRef.current, body: '編集中' };
      resolveResponse?.({
        json: () => Promise.resolve({ messages: [lintMessage] }),
        ok: true,
      } as Response);
      lintResult = await request;
    });

    expect(lintResult).toBeNull();
    expect(result.current.lintMessages).toEqual([]);
    expect(setMessage).toHaveBeenLastCalledWith('本文が変わったため、もう一度校正してください');
  });
});
