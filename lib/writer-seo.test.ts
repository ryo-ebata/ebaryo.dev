import { describe, expect, it } from 'vitest';
import { createAutomaticSeo } from './writer-seo';

describe('createAutomaticSeo', () => {
  it('creates SEO fields from the article without AI', () => {
    expect(
      createAutomaticSeo({
        body: '# 見出し\n本文の冒頭です。',
        eyecatch: { url: 'images/cover.png' },
        title: '記事タイトル',
      })
    ).toEqual({
      description: '見出し 本文の冒頭です。',
      eyecatch: { alt: '記事タイトルのサムネイル画像', url: 'images/cover.png' },
      seoTitle: '記事タイトル',
    });
  });

  it('keeps manually entered values', () => {
    expect(
      createAutomaticSeo({
        body: '本文',
        description: '手入力の説明',
        eyecatch: { alt: '手入力のalt', url: 'images/cover.png' },
        seoTitle: '手入力のSEOタイトル',
        title: '記事タイトル',
      })
    ).toMatchObject({
      description: '手入力の説明',
      eyecatch: { alt: '手入力のalt' },
      seoTitle: '手入力のSEOタイトル',
    });
  });
});
