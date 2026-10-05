import { describe, expect, it } from 'vitest';
import { siteConfig } from '@/config/site';
import type { BaseContentMetadata } from './content';
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from './jsonld';

const createMockMetadata = (overrides: Partial<BaseContentMetadata> = {}): BaseContentMetadata => ({
  slug: 'test-slug',
  title: 'テスト記事',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
  ...overrides,
});

describe('generateArticleJsonLd', () => {
  it('BlogPosting型のJSON-LDを生成する', () => {
    const metadata = createMockMetadata();
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('BlogPosting');
    expect(result.headline).toBe('テスト記事');
    expect(result.url).toBe('https://example.com/blog/test');
  });

  it('datePublishedとdateModifiedを含む', () => {
    const metadata = createMockMetadata();
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.datePublished).toBe('2025-01-01T00:00:00Z');
    expect(result.dateModified).toBe('2025-01-02T00:00:00Z');
  });

  it('eyecatchがあっても専用OG画像を使う', () => {
    const metadata = createMockMetadata({
      eyecatch: { url: 'https://example.com/image.jpg' },
    });
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.image).toBe(`${siteConfig.url}/og?title=${encodeURIComponent(metadata.title)}`);
  });

  it('eyecatchがない場合は動的OG画像にフォールバックする', () => {
    const metadata = createMockMetadata();
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.image).toBe(`${siteConfig.url}/og?title=${encodeURIComponent(metadata.title)}`);
  });

  it('mainEntityOfPageを含む', () => {
    const metadata = createMockMetadata();
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/blog/test',
    });
  });

  it('tagsがある場合keywordsを含む', () => {
    const metadata = createMockMetadata({ tags: ['React', 'TypeScript'] });
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.keywords).toBe('React, TypeScript');
  });

  it('tagsがない場合keywordsを含まない', () => {
    const metadata = createMockMetadata();
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.keywords).toBeUndefined();
  });

  it('authorとpublisherを含む', () => {
    const metadata = createMockMetadata();
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.author).toEqual({
      '@type': 'Person',
      description: expect.any(String),
      name: siteConfig.author.name,
      url: expect.any(String),
      sameAs: expect.any(Array),
    });
    expect(result.publisher).toEqual({
      '@type': 'Organization',
      name: expect.any(String),
      url: expect.any(String),
    });
  });

  it('descriptionが未入力の場合contentMarkdownの本文冒頭にフォールバックする', () => {
    const metadata = createMockMetadata({ description: undefined });
    const result = generateArticleJsonLd(
      metadata,
      'https://example.com/blog/test',
      '本文の冒頭テキスト'
    );

    expect(result.description).toBe('本文の冒頭テキスト');
  });

  it('descriptionもcontentMarkdownも無い場合サイト全体の説明文にフォールバックする', () => {
    const metadata = createMockMetadata({ description: undefined });
    const result = generateArticleJsonLd(metadata, 'https://example.com/blog/test');

    expect(result.description).toBe(siteConfig.description);
  });
});

describe('generateWebSiteJsonLd', () => {
  it('WebSite型のJSON-LDを生成する', () => {
    const result = generateWebSiteJsonLd();

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('WebSite');
    expect(result.name).toBeDefined();
    expect(result.url).toBeDefined();
  });

  it('廃止されたSearchActionを含まない', () => {
    const result = generateWebSiteJsonLd();

    expect(result.potentialAction).toBeUndefined();
  });
});

describe('generateOrganizationJsonLd', () => {
  it('Organization型のJSON-LDを生成する', () => {
    const result = generateOrganizationJsonLd();

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Organization');
    expect(result.name).toBeDefined();
    expect(result.url).toBeDefined();
  });

  it('sameAsにソーシャルリンクを含む', () => {
    const result = generateOrganizationJsonLd();

    expect(result.sameAs).toBeDefined();
    expect(Array.isArray(result.sameAs)).toBe(true);
  });
});

describe('generateBreadcrumbJsonLd', () => {
  it('BreadcrumbList を position 付き itemListElement で生成する', () => {
    const result = generateBreadcrumbJsonLd([
      { name: 'Home', url: 'https://ebaryo.dev' },
      { name: 'ブログ', url: 'https://ebaryo.dev/blog' },
      { name: 'テスト記事', url: 'https://ebaryo.dev/blog/test' },
    ]);

    expect(result['@type']).toBe('BreadcrumbList');
    expect(result.itemListElement).toEqual([
      { '@type': 'ListItem', item: 'https://ebaryo.dev', name: 'Home', position: 1 },
      { '@type': 'ListItem', item: 'https://ebaryo.dev/blog', name: 'ブログ', position: 2 },
      {
        '@type': 'ListItem',
        item: 'https://ebaryo.dev/blog/test',
        name: 'テスト記事',
        position: 3,
      },
    ]);
  });
});
