import { describe, expect, it } from 'vitest';
import { isValidRevalidationAuthorization } from './revalidate-auth';

describe('isValidRevalidationAuthorization', () => {
  it('Bearerトークンが一致する場合だけ許可する', () => {
    expect(isValidRevalidationAuthorization('Bearer secret', 'secret')).toBe(true);
    expect(isValidRevalidationAuthorization('Bearer invalid', 'secret')).toBe(false);
  });

  it('未設定やBearer以外の認証を拒否する', () => {
    expect(isValidRevalidationAuthorization(null, 'secret')).toBe(false);
    expect(isValidRevalidationAuthorization('Basic secret', 'secret')).toBe(false);
    expect(isValidRevalidationAuthorization('Bearer secret', undefined)).toBe(false);
  });
});
