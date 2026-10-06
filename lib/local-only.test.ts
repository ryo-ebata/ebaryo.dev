import { describe, expect, it } from 'vitest';
import { getHostnameFromHost, isLocalHostname } from './local-only';

describe('getHostnameFromHost', () => {
  it.each([
    ['localhost:3000', 'localhost'],
    ['127.0.0.1:3000', '127.0.0.1'],
    ['[::1]:3000', '::1'],
    ['[::1]', '::1'],
  ])('%sから%sを返す', (host, expected) => {
    expect(getHostnameFromHost(host)).toBe(expected);
  });
});

describe('isLocalHostname', () => {
  it('IPv4とIPv6のloopbackを許可する', () => {
    expect(isLocalHostname('127.0.0.1')).toBe(true);
    expect(isLocalHostname('127.0.0.2')).toBe(true);
    expect(isLocalHostname('::1')).toBe(true);
    expect(isLocalHostname('[::1]')).toBe(true);
    expect(isLocalHostname('192.168.1.10')).toBe(false);
  });
});
