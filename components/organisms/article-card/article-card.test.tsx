import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleCard } from './article-card';

describe('ArticleCard', () => {
  const defaultProps = {
    date: '2025-01-01T00:00:00Z',
    href: '/blog/test-post',
    title: 'テスト記事',
  };

  it('タイトルを表示する', () => {
    render(<ArticleCard {...defaultProps} />);
    expect(screen.getByText('テスト記事')).toBeInTheDocument();
  });

  it('説明文を表示する', () => {
    render(<ArticleCard {...defaultProps} description="テスト説明" />);
    expect(screen.getByText('テスト説明')).toBeInTheDocument();
  });

  it('説明文がない場合は表示しない', () => {
    render(<ArticleCard {...defaultProps} />);
    expect(screen.queryByText('テスト説明')).not.toBeInTheDocument();
  });

  it('タグを表示する', () => {
    render(<ArticleCard {...defaultProps} tags={['React', 'TypeScript']} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('外部リンクの場合target=_blankを設定する', () => {
    render(<ArticleCard {...defaultProps} isExternal />);
    const links = screen.getAllByRole('link');
    const externalLink = links.find((link) => link.getAttribute('target') === '_blank');
    expect(externalLink).toBeDefined();
  });

  it('内部リンクの場合target=_blankを設定しない', () => {
    render(<ArticleCard {...defaultProps} isExternal={false} />);
    const links = screen.getAllByRole('link');
    const hasBlankTarget = links.some((link) => link.getAttribute('target') === '_blank');
    expect(hasBlankTarget).toBe(false);
  });

  it('emoji型のアイコンを表示する', () => {
    render(<ArticleCard {...defaultProps} icon={{ emoji: '🎉', type: 'emoji' }} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('更新日が公開日と異なる場合は更新日を表示する', () => {
    render(<ArticleCard {...defaultProps} updatedAt="2025-02-03T00:00:00Z" />);

    expect(screen.getByText('更新')).toBeInTheDocument();
    expect(screen.getByText('2025.02.03')).toBeInTheDocument();
  });
});
