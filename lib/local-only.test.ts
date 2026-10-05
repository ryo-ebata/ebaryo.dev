import { describe, expect, it } from 'vitest';
import { isLocalHostname } from './local-only';

describe('isLocalHostname', () => {
  it('IPv4とIPv6のloopbackを許可する', () => {
    expect(isLocalHostname('127.0.0.1')).toBe(true);
    expect(isLocalHostname('127.0.0.2')).toBe(true);
    expect(isLocalHostname('::1')).toBe(true);
    expect(isLocalHostname('[::1]')).toBe(true);
    expect(isLocalHostname('192.168.1.10')).toBe(false);
  });
});
