import { afterEach, describe, expect, it, vi } from 'vitest';
import { guardLocalWriterRequest } from './local-writer-security';

describe('guardLocalWriterRequest', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('loopbackからの読み取りを許可する', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(
      guardLocalWriterRequest(new Request('http://localhost:3000/api/local-writer'))
    ).toBeNull();
  });

  it('LANホストからのアクセスを拒否する', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = guardLocalWriterRequest(
      new Request('http://192.168.1.10:3000/api/local-writer')
    );
    expect(response?.status).toBe(403);
  });

  it('更新操作では同一Originを要求する', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = guardLocalWriterRequest(
      new Request('http://localhost:3000/api/local-writer', {
        headers: { origin: 'http://evil.example' },
      }),
      { mutation: true }
    );
    expect(response?.status).toBe(403);
  });
});
