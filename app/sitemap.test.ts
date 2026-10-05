import { describe, expect, it } from 'vitest';
import type { BaseContentMetadata } from '@/lib/content';
import { createStaticPages, createTagEntries } from './sitemap';

const createPost = (slug: string, tags: string[], updatedAt: string): BaseContentMetadata => ({
  createdAt: updatedAt,
  slug,
  tags,
  title: slug,
  updatedAt,
});

describe('sitemap', () => {
  it('静的ページへアクセス時刻を更新日として設定しない', () => {
    expect(createStaticPages().every((entry) => entry.lastModified === undefined)).toBe(true);
  });

  it('記事が1件だけのタグを除外し、複数記事の最新更新日を使う', () => {
    const posts = [
      createPost('old', ['shared', 'single'], '2025-01-01T00:00:00Z'),
      createPost('new', ['shared'], '2025-03-01T00:00:00Z'),
    ];

    const entries = createTagEntries(posts);

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toContain('/blog/tag/shared');
    expect(entries[0].lastModified).toEqual(new Date('2025-03-01T00:00:00Z'));
  });
});
