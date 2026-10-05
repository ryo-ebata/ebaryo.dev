import { describe, expect, it } from 'vitest';

import type { BaseContentMetadata } from './content';
import { getRelatedPosts } from './related';

const post = (
  slug: string,
  tags: string[],
  createdAt = '2025-01-01T00:00:00Z'
): BaseContentMetadata => ({
  slug,
  title: slug,
  createdAt,
  updatedAt: createdAt,
  tags,
});

describe('getRelatedPosts', () => {
  const current = post('current', ['react', 'typescript', 'next']);

  it('共通タグが多い順に上位を返し、自分自身は除外する', () => {
    const all = [
      current,
      post('a', ['react', 'typescript']),
      post('b', ['react']),
      post('c', ['go']),
    ];
    const result = getRelatedPosts(current, all, 3).map((p) => p.slug);
    expect(result[0]).toBe('a');
    expect(result[1]).toBe('b');
    expect(result).not.toContain('current');
  });

  it('limit 件に制限する', () => {
    const all = [current, post('a', ['react']), post('b', ['next']), post('c', ['typescript'])];
    expect(getRelatedPosts(current, all, 2)).toHaveLength(2);
  });

  it('同点は新しい順(createdAt 降順)で安定ソート', () => {
    const all = [
      current,
      post('old', ['react'], '2025-01-01T00:00:00Z'),
      post('new', ['react'], '2025-06-01T00:00:00Z'),
    ];
    expect(getRelatedPosts(current, all, 2).map((p) => p.slug)).toEqual(['new', 'old']);
  });

  it('共通タグが無ければ何も返さない', () => {
    const all = [
      current,
      post('x', ['go'], '2025-03-01T00:00:00Z'),
      post('y', ['rust'], '2025-05-01T00:00:00Z'),
    ];
    expect(getRelatedPosts(current, all, 2)).toEqual([]);
  });
});
