import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import { classifyLinkCardUrl } from '@/lib/link-card';
import { getLinkCardMetadata } from '@/lib/link-preview';

export async function POST(request: Request) {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  const { url } = (await request.json()) as { url?: unknown };
  if (typeof url !== 'string') return localApiError('URLが必要です', 400);
  const target = classifyLinkCardUrl(url);
  if (!target) return localApiError('URLを確認してください', 400);

  const metadata = await getLinkCardMetadata(target);
  return NextResponse.json({ metadata });
}
