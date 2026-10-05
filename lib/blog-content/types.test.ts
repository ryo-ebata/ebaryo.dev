import { describe, expect, it } from 'vitest';
import type { Frontmatter } from './types';
import { toBaseContentMetadata } from './types';

const createFrontmatter = (overrides: Partial<Frontmatter> = {}): Frontmatter => ({
  title: 'テスト記事',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
  ...overrides,
});

describe('toBaseContentMetadata', () => {
  it('createdAt/updatedAtをそのまま使用する', () => {
    const result = toBaseContentMetadata('test-post', createFrontmatter());
    expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2025-01-02T00:00:00.000Z');
  });

  it('slug引数をそのまま使用する', () => {
    const result = toBaseContentMetadata('custom-slug', createFrontmatter());
    expect(result.slug).toBe('custom-slug');
  });

  it('ネストしたslug(dir/nested-post)もそのまま使用する', () => {
    const result = toBaseContentMetadata('dir/nested-post', createFrontmatter());
    expect(result.slug).toBe('dir/nested-post');
  });

  it('tagsをそのまま配列として返す', () => {
    const result = toBaseContentMetadata(
      'test-post',
      createFrontmatter({ tags: ['React', 'TypeScript'] })
    );
    expect(result.tags).toEqual(['React', 'TypeScript']);
  });

  it('tagsがない場合はundefinedを返す', () => {
    const result = toBaseContentMetadata('test-post', createFrontmatter());
    expect(result.tags).toBeUndefined();
  });

  it('characterCountを設定する', () => {
    const result = toBaseContentMetadata('test-post', createFrontmatter(), 1234);
    expect(result.characterCount).toBe(1234);
  });

  it('descriptionを含める', () => {
    const result = toBaseContentMetadata(
      'test-post',
      createFrontmatter({ description: 'テスト説明' })
    );
    expect(result.description).toBe('テスト説明');
  });

  it('draftを含める', () => {
    const result = toBaseContentMetadata('test-post', createFrontmatter({ draft: true }));
    expect(result.draft).toBe(true);
  });

  it('検索メタデータを含める', () => {
    const result = toBaseContentMetadata(
      'test-post',
      createFrontmatter({
        canonicalUrl: 'https://example.com/original',
        noindex: true,
        seoTitle: '検索用タイトル',
      })
    );
    expect(result.canonicalUrl).toBe('https://example.com/original');
    expect(result.noindex).toBe(true);
    expect(result.seoTitle).toBe('検索用タイトル');
  });

  it('絶対URLのeyecatchはそのまま使用する', () => {
    const result = toBaseContentMetadata(
      'test-post',
      createFrontmatter({
        eyecatch: { url: 'https://example.com/image.jpg', width: 800, height: 600 },
      })
    );
    expect(result.eyecatch).toEqual({
      url: 'https://example.com/image.jpg',
      width: 800,
      height: 600,
    });
  });

  it('相対パスのeyecatchをルート相対の配信URLに変換する(next/imageのremotePatterns制約を避けるため絶対URL化はしない)', () => {
    const result = toBaseContentMetadata(
      'test-post',
      createFrontmatter({
        eyecatch: { url: 'images/eyecatch.png', width: 1200, height: 630 },
      })
    );
    expect(result.eyecatch?.url).toBe('/blog-assets/test-post/images/eyecatch.png');
    expect(result.eyecatch?.width).toBe(1200);
  });

  it('eyecatchがない場合はundefinedを返す', () => {
    const result = toBaseContentMetadata('test-post', createFrontmatter());
    expect(result.eyecatch).toBeUndefined();
  });
});
