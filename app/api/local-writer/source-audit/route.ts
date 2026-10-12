import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import { inspectExternalWriterSource } from '@/lib/link-preview';
import {
  assessWriterSource,
  type WriterSourceAuditInput,
  type WriterSourceAuditResult,
} from '@/lib/writer-source-audit';

const isAuditInput = (value: unknown): value is WriterSourceAuditInput => {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<WriterSourceAuditInput>;
  return (
    typeof input.claim === 'string' &&
    input.claim.length <= 1_000 &&
    typeof input.claimOffset === 'number' &&
    Number.isSafeInteger(input.claimOffset) &&
    typeof input.url === 'string' &&
    input.url.length <= 2_048 &&
    /^https?:\/\//u.test(input.url)
  );
};

export async function POST(request: Request) {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  const body = (await request.json()) as { sources?: unknown };
  if (!Array.isArray(body.sources) || body.sources.length === 0 || body.sources.length > 12)
    return localApiError('検証する出典は1〜12件にしてください', 400);
  if (!body.sources.every(isAuditInput)) return localApiError('出典の形式を確認してください', 400);

  const results: WriterSourceAuditResult[] = await Promise.all(
    body.sources.map(async (source) => {
      const snapshot = await inspectExternalWriterSource(source.url);
      return assessWriterSource(source, snapshot);
    })
  );
  return NextResponse.json({ results });
}
