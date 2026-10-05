import { describe, expect, it } from 'vitest';
import { localArticleSchema, serializeLocalArticle } from './local-writer';

describe('localArticleSchema', () => {
  it('rejects unsafe slugs', () => {
    const result = localArticleSchema.safeParse({
      body: '本文',
      createdAt: '2026-10-03',
      draft: true,
      slug: '../escape',
      tags: [],
      title: '記事',
    });

    expect(result.success).toBe(false);
  });
});

describe('serializeLocalArticle', () => {
  it('creates article frontmatter and body', () => {
    const result = serializeLocalArticle(
      {
        body: '# 本文',
        createdAt: '2026-10-03',
        description: '説明',
        draft: true,
        slug: 'sample-post',
        tags: ['Next.js', 'ブログ'],
        title: '記事タイトル',
      },
      new Date('2026-10-03T12:34:56.000Z')
    );

    expect(result).toContain('title: 記事タイトル');
    expect(result).toContain("createdAt: '2026-10-03T00:00:00.000Z'");
    expect(result).toContain("updatedAt: '2026-10-03T12:34:56.000Z'");
    expect(result).toContain('- Next.js');
    expect(result).toContain('# 本文');
  });

  it('preserves unknown frontmatter when updating an article', () => {
    const result = serializeLocalArticle(
      {
        body: '本文',
        createdAt: '2026-10-03',
        draft: false,
        slug: 'sample-post',
        tags: [],
        title: '更新後',
      },
      new Date('2026-10-03T12:34:56.000Z'),
      { eyecatch: { url: 'images/cover.png', width: 1200 } }
    );

    expect(result).toContain('eyecatch:');
    expect(result).toContain('url: images/cover.png');
  });

  it('writes eyecatch metadata from the editor', () => {
    const result = serializeLocalArticle(
      {
        body: '本文',
        createdAt: '2026-10-03',
        draft: true,
        eyecatch: { height: 630, url: 'images/eyecatch.png', width: 1200 },
        slug: 'sample-post',
        tags: [],
        title: '記事',
      },
      new Date('2026-10-03T12:34:56.000Z')
    );

    expect(result).toContain('url: images/eyecatch.png');
    expect(result).toContain('width: 1200');
    expect(result).toContain('height: 630');
  });

  it('removes existing eyecatch metadata when explicitly cleared', () => {
    const result = serializeLocalArticle(
      {
        body: '本文',
        createdAt: '2026-10-03',
        draft: true,
        eyecatch: null,
        slug: 'sample-post',
        tags: [],
        title: '記事',
      },
      new Date('2026-10-03T12:34:56.000Z'),
      { eyecatch: { url: 'images/old.png' } }
    );

    expect(result).not.toContain('eyecatch:');
    expect(result).not.toContain('images/old.png');
  });

  it('writes and clears search metadata', () => {
    const written = serializeLocalArticle(
      {
        body: '本文',
        canonicalUrl: 'https://example.com/original',
        createdAt: '2026-10-03',
        draft: false,
        noindex: true,
        seoTitle: '検索用タイトル',
        slug: 'sample-post',
        tags: [],
        title: '記事',
      },
      new Date('2026-10-03T12:34:56.000Z')
    );
    expect(written).toContain('seoTitle: 検索用タイトル');
    expect(written).toContain("canonicalUrl: 'https://example.com/original'");
    expect(written).toContain('noindex: true');

    const cleared = serializeLocalArticle(
      {
        body: '本文',
        canonicalUrl: '',
        createdAt: '2026-10-03',
        draft: false,
        noindex: false,
        seoTitle: '',
        slug: 'sample-post',
        tags: [],
        title: '記事',
      },
      new Date('2026-10-03T12:34:56.000Z'),
      { canonicalUrl: 'https://old.example.com', noindex: true, seoTitle: '古いタイトル' }
    );
    expect(cleared).not.toContain('canonicalUrl:');
    expect(cleared).not.toContain('noindex:');
    expect(cleared).not.toContain('古いタイトル');
    expect(cleared).toContain('seoTitle: 記事');
    expect(cleared).toContain('description: 本文');
  });

  it('normalizes legacy automatic links when saving', () => {
    const result = serializeLocalArticle(
      {
        body: '<https://rikyu.ai/>',
        createdAt: '2026-10-03',
        draft: true,
        slug: 'rikyu-ai',
        tags: [],
        title: 'Rikyū',
      },
      new Date('2026-10-03T12:34:56.000Z')
    );

    expect(result).toContain('https://rikyu.ai/');
    expect(result).not.toContain('<https://rikyu.ai/>');
  });
});
