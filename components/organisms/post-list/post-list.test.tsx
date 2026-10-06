import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { trackProductEvent } from '@/lib/analytics';
import type { ArticleListItem } from '@/lib/content';
import { PostList } from './post-list';

vi.mock('@/lib/analytics', () => ({
  trackProductEvent: vi.fn(),
}));

const createMockPost = (overrides: Partial<ArticleListItem> = {}): ArticleListItem => ({
  slug: 'test-post',
  title: 'テスト記事',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
  ...overrides,
});

describe('PostList', () => {
  it('投稿のリストをレンダリングする', () => {
    const posts = [
      createMockPost({ slug: 'post-1', title: '記事1' }),
      createMockPost({ slug: 'post-2', title: '記事2' }),
    ];
    render(<PostList posts={posts} />);
    expect(screen.getByText('記事1')).toBeInTheDocument();
    expect(screen.getByText('記事2')).toBeInTheDocument();
  });

  it('投稿が空の場合EmptyStateを表示する', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText('No Projects Yet')).toBeInTheDocument();
  });

  it('デフォルトのbasePathを使用する', () => {
    const posts = [createMockPost()];
    render(<PostList posts={posts} />);
    const links = screen.getAllByRole('link');
    const postLink = links.find((link) => link.getAttribute('href')?.includes('/blog/test-post'));
    expect(postLink).toBeDefined();
  });

  it('カスタムbasePathを使用する', () => {
    const posts = [createMockPost()];
    render(<PostList posts={posts} basePath="/notes" />);
    const links = screen.getAllByRole('link');
    const postLink = links.find((link) => link.getAttribute('href')?.includes('/notes/test-post'));
    expect(postLink).toBeDefined();
  });

  it('外部記事は指定URLを別タブで開く', () => {
    const posts = [
      createMockPost({
        href: 'https://zenn.dev/example/article',
        isExternal: true,
        slug: 'zenn-1',
      }),
    ];
    render(<PostList posts={posts} />);

    const postLink = screen.getByRole('link', { name: 'テスト記事' });
    expect(postLink).toHaveAttribute('href', 'https://zenn.dev/example/article');
    expect(postLink).toHaveAttribute('target', '_blank');
  });

  it('計測対象のカードクリックを送る', () => {
    render(<PostList posts={[createMockPost()]} trackingPlacement="related_posts" />);

    fireEvent.click(screen.getByRole('link', { name: 'テスト記事' }));

    expect(trackProductEvent).toHaveBeenCalledWith('content_link_click', {
      destination_path: '/blog/test-post',
      placement: 'related_posts',
    });
  });
});
