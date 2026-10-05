import { NextResponse } from 'next/server';
import { classifyLinkCardUrl } from '@/lib/link-card';
import { getLinkCardMetadata } from '@/lib/link-preview';
import { guardLocalWriterRequest } from '@/lib/local-writer-security';

export async function POST(request: Request) {
  const denied = guardLocalWriterRequest(request, { mutation: true });
  if (denied) return denied;

  const { url } = (await request.json()) as { url?: unknown };
  if (typeof url !== 'string')
    return NextResponse.json({ error: 'URLが必要です' }, { status: 400 });
  const target = classifyLinkCardUrl(url);
  if (!target) return NextResponse.json({ error: 'URLを確認してください' }, { status: 400 });

  const metadata = await getLinkCardMetadata(target);
  return NextResponse.json({ metadata });
}
