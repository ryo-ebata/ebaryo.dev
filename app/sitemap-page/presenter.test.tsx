import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { BaseContentMetadata } from '@/lib/content';
import { SitemapPresenter } from './presenter';

const createMockPost = (overrides: Partial<BaseContentMetadata> = {}): BaseContentMetadata => ({
  slug: 'test-post',
  title: 'テスト記事',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
  ...overrides,
});

describe('SitemapPresenter', () => {
  it('ページタイトルを表示する', () => {
    render(<SitemapPresenter posts={[]} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('サイトマップ');
  });

  it('静的ページのリンクを表示する', () => {
    render(<SitemapPresenter posts={[]} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/portfolio');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
  });

  it('記事リンクを表示する', () => {
    const posts = [
      createMockPost({ slug: 'post-1', title: '記事1' }),
      createMockPost({ slug: 'post-2', title: '記事2' }),
    ];
    render(<SitemapPresenter posts={posts} />);
    expect(screen.getByRole('link', { name: '記事1' })).toHaveAttribute('href', '/blog/post-1');
    expect(screen.getByRole('link', { name: '記事2' })).toHaveAttribute('href', '/blog/post-2');
  });

  it('記事がない場合でも静的ページのリンクは表示する', () => {
    render(<SitemapPresenter posts={[]} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });
});
