import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeWriterFacts } from '@/lib/writer-facts';
import { useWriterSourceAudit } from './use-writer-source-audit';

afterEach(() => vi.restoreAllMocks());

describe('useWriterSourceAudit', () => {
  it('本文中の外部出典を検証して結果を主張へ対応付ける', async () => {
    const analysis = analyzeWriterFacts(
      '検証記事',
      'Next.jsではキャッシュを再検証できる。[公式](https://example.com/docs)'
    );
    const claim = analysis.claims[0];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              claim: claim.text,
              claimOffset: claim.offset,
              finalUrl: 'https://example.com/docs',
              issues: [],
              relevance: 0.8,
              status: 'healthy',
              statusCode: 200,
              title: '公式資料',
              url: 'https://example.com/docs',
            },
          ],
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 }
      )
    );
    const { result } = renderHook(() => useWriterSourceAudit(analysis));

    expect(result.current.auditCount).toBe(1);
    await act(() => result.current.runAudit());

    expect(result.current.resultFor(claim.offset, 'https://example.com/docs')).toMatchObject({
      status: 'healthy',
      title: '公式資料',
    });
    expect(result.current.message).toBe('すべて取得でき、主張との関連も確認できた');
  });
});
