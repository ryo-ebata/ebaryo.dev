import { describe, expect, it } from 'vitest';
import type { BaseContentMetadata } from './content';
import { contentThemes, getLatestPostDate, getThemePosts, getThemesForTags } from './themes';

const createPost = (slug: string, tags: string[], updatedAt: string): BaseContentMetadata => ({
  createdAt: updatedAt,
  slug,
  tags,
  title: slug,
  updatedAt,
});

describe('themes', () => {
  it('テーマに含まれるタグの記事だけを返す', () => {
    const theme = contentThemes[0];
    const posts = [
      createPost('ai', ['ClaudeCode'], '2025-01-01T00:00:00Z'),
      createPost('css', ['CSS'], '2025-01-02T00:00:00Z'),
    ];

    expect(getThemePosts(theme, posts).map((post) => post.slug)).toEqual(['ai']);
  });

  it('記事群の最新更新日を返す', () => {
    const posts = [
      createPost('old', ['AI'], '2025-01-01T00:00:00Z'),
      createPost('new', ['AI'], '2025-03-01T00:00:00Z'),
    ];

    expect(getLatestPostDate(posts)?.toISOString()).toBe('2025-03-01T00:00:00.000Z');
  });

  it('タグに対応するテーマを返す', () => {
    expect(getThemesForTags(['ClaudeCode', 'CSS']).map((theme) => theme.slug)).toEqual([
      'ai-development',
      'web-development',
    ]);
  });
});
