import { NextResponse } from 'next/server';

const isLoopbackHost = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '::1' ||
  hostname === '[::1]' ||
  hostname.startsWith('127.');

export const guardLocalWriterRequest = (
  request: Request,
  options: { mutation?: boolean } = {}
): NextResponse | null => {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });

  const requestUrl = new URL(request.url);
  if (!isLoopbackHost(requestUrl.hostname)) {
    return NextResponse.json({ error: 'ローカル環境からのみ利用できます' }, { status: 403 });
  }

  if (options.mutation) {
    const origin = request.headers.get('origin');
    if (!origin) return NextResponse.json({ error: 'Originを確認できません' }, { status: 403 });
    try {
      const originUrl = new URL(origin);
      if (originUrl.origin !== requestUrl.origin || !isLoopbackHost(originUrl.hostname)) {
        return NextResponse.json(
          { error: '同一のローカル環境からのみ操作できます' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Originが不正です' }, { status: 403 });
    }
  }

  return null;
};
