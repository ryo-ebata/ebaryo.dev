import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { trackProductEvent } from '@/lib/analytics';
import { ArticleThemeLinks } from './article-theme-links';

vi.mock('@/lib/analytics', () => ({
  trackProductEvent: vi.fn(),
}));

describe('ArticleThemeLinks', () => {
  it('記事タグに対応するテーマだけを表示する', () => {
    render(<ArticleThemeLinks tags={['ClaudeCode']} />);

    expect(screen.getByRole('link', { name: '生成AIと開発' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Web開発' })).not.toBeInTheDocument();
  });

  it('対応テーマがない場合は表示しない', () => {
    const { container } = render(<ArticleThemeLinks tags={['未分類']} />);

    expect(container.firstChild).toBeNull();
  });

  it('テーマクリックを計測する', () => {
    render(<ArticleThemeLinks tags={['CSS']} />);

    fireEvent.click(screen.getByRole('link', { name: 'Web開発' }));

    expect(trackProductEvent).toHaveBeenCalledWith('content_link_click', {
      destination_path: '/blog/theme/web-development',
      placement: 'article_theme',
    });
  });
});
