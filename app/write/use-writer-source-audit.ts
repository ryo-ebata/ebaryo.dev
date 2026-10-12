'use client';

import { useMemo, useState } from 'react';
import { parseApiResponse } from '@/lib/client-api';
import type { WriterFactAnalysis } from '@/lib/writer-facts';
import type { WriterSourceAuditInput, WriterSourceAuditResult } from '@/lib/writer-source-audit';

const resultKey = (claimOffset: number, url: string) => `${claimOffset}:${url}`;

export const useWriterSourceAudit = (analysis: WriterFactAnalysis) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [message, setMessage] = useState<string>();
  const [results, setResults] = useState<Record<string, WriterSourceAuditResult>>({});
  const sources = useMemo<WriterSourceAuditInput[]>(
    () =>
      analysis.claims
        .flatMap((claim) =>
          claim.evidence
            .filter((evidence) => /^https?:\/\//u.test(evidence))
            .map((url) => ({ claim: claim.text, claimOffset: claim.offset, url }))
        )
        .slice(0, 12),
    [analysis.claims]
  );

  const runAudit = async () => {
    if (sources.length === 0 || isAuditing) return;
    setIsAuditing(true);
    setMessage(undefined);
    try {
      const response = await fetch('/api/local-writer/source-audit', {
        body: JSON.stringify({ sources }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      const data = await parseApiResponse<{ results: WriterSourceAuditResult[] }>(
        response,
        '出典を検証できませんでした'
      );
      setResults(
        Object.fromEntries(
          data.results.map((result) => [resultKey(result.claimOffset, result.url), result])
        )
      );
      const warnings = data.results.filter((result) => result.status !== 'healthy').length;
      setMessage(
        warnings === 0 ? 'すべて取得でき、主張との関連も確認できた' : `${warnings}件を確認`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '出典を検証できませんでした');
    } finally {
      setIsAuditing(false);
    }
  };

  return {
    auditCount: sources.length,
    isAuditing,
    message,
    resultFor: (claimOffset: number, url: string) => results[resultKey(claimOffset, url)],
    runAudit,
  };
};
