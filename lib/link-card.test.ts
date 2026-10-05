import { describe, expect, test } from 'vitest';
import { siteConfig } from '@/config/site';
import { classifyLinkCardUrl } from './link-card';

describe('classifyLinkCardUrl', () => {
  test('相対ブログURLを内部リンクとして判定する', () => {
    expect(classifyLinkCardUrl('/blog/my-post')).toEqual({
      display: '/blog/my-post',
      href: '/blog/my-post',
      kind: 'internal',
    });
  });

  test('同一サイトの絶対URLを内部リンクへ正規化する', () => {
    expect(classifyLinkCardUrl(`${siteConfig.url}/blog/my-post?from=test#section`)).toEqual({
      display: '/blog/my-post',
      href: '/blog/my-post?from=test#section',
      kind: 'internal',
    });
  });

  test('別サイトを外部リンクとして判定する', () => {
    expect(classifyLinkCardUrl('https://example.com/path')).toEqual({
      display: 'example.com',
      href: 'https://example.com/path',
      kind: 'external',
    });
  });

  test('通常の相対URLはカード対象にしない', () => {
    expect(classifyLinkCardUrl('/about')).toBeNull();
  });
});
