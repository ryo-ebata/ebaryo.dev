import { NextResponse } from 'next/server';
import { isLocalHostname } from './local-only';

interface LocalApiGuardOptions {
  mutation?: boolean;
}

export const localApiError = (
  error: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse => NextResponse.json({ error, ...details }, { status });

export const guardLocalApiRequest = (
  request: Request,
  { mutation = false }: LocalApiGuardOptions = {}
): NextResponse | null => {
  if (process.env.NODE_ENV !== 'development') return localApiError('Not found', 404);

  const requestUrl = new URL(request.url);
  if (!isLocalHostname(requestUrl.hostname)) {
    return localApiError('ローカル環境からのみ利用できます', 403);
  }
  if (!mutation) return null;

  const origin = request.headers.get('origin');
  if (!origin) return localApiError('Originを確認できません', 403);
  try {
    const originUrl = new URL(origin);
    if (originUrl.origin !== requestUrl.origin || !isLocalHostname(originUrl.hostname)) {
      return localApiError('同一のローカル環境からのみ操作できます', 403);
    }
  } catch {
    return localApiError('Originが不正です', 403);
  }

  return null;
};
