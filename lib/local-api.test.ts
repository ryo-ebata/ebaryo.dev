import { afterEach, describe, expect, it, vi } from 'vitest';
import { guardLocalApiRequest, localApiError } from './local-api';

describe('guardLocalApiRequest', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('開発環境のloopbackから読み取れる', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(guardLocalApiRequest(new Request('http://localhost:3000/api/local-writer'))).toBeNull();
    expect(
      guardLocalApiRequest(new Request('http://127.0.0.1:3000/api/local-portfolio'))
    ).toBeNull();
  });

  it('本番環境では存在を隠す', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const response = guardLocalApiRequest(new Request('http://localhost:3000/api/local-portfolio'));

    expect(response?.status).toBe(404);
    await expect(response?.json()).resolves.toEqual({ error: 'Not found' });
  });

  it('LANホストからのアクセスを拒否する', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const response = guardLocalApiRequest(new Request('http://192.168.1.10:3000/api/local-writer'));

    expect(response?.status).toBe(403);
  });

  it('更新操作では同一Originを要求する', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const missingOrigin = guardLocalApiRequest(
      new Request('http://localhost:3000/api/local-portfolio'),
      { mutation: true }
    );
    const foreignOrigin = guardLocalApiRequest(
      new Request('http://localhost:3000/api/local-writer', {
        headers: { origin: 'http://evil.example' },
      }),
      { mutation: true }
    );
    const sameOrigin = guardLocalApiRequest(
      new Request('http://localhost:3000/api/local-writer', {
        headers: { origin: 'http://localhost:3000' },
      }),
      { mutation: true }
    );

    expect(missingOrigin?.status).toBe(403);
    expect(foreignOrigin?.status).toBe(403);
    expect(sameOrigin).toBeNull();
  });
});

describe('localApiError', () => {
  it('共通形式へ詳細情報を追加できる', async () => {
    const response = localApiError('入力内容を確認してください', 400, {
      issues: [{ path: ['title'] }],
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: '入力内容を確認してください',
      issues: [{ path: ['title'] }],
    });
  });
});
