import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('totalPagesが1以下の場合は何も表示しない', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} basePath="/blog" />);

    expect(container.firstChild).toBeNull();
  });

  it('ページネーションをレンダリングする', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath="/blog" />);

    expect(screen.getByRole('navigation', { name: 'ページネーション' })).toBeInTheDocument();
  });

  it('最初のページでは「前へ」ボタンが表示されない', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath="/blog" />);

    expect(screen.queryByRole('button', { name: '前へ' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument();
  });

  it('最後のページでは「次へ」ボタンが表示されない', () => {
    render(<Pagination currentPage={5} totalPages={5} basePath="/blog" />);

    expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '次へ' })).not.toBeInTheDocument();
  });

  it('中間ページでは「前へ」「次へ」両方表示される', () => {
    render(<Pagination currentPage={3} totalPages={5} basePath="/blog" />);

    expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument();
  });

  it('現在のページ番号が表示される', () => {
    render(<Pagination currentPage={3} totalPages={5} basePath="/blog" />);

    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('最初のページへのリンクはbasePathのみ', () => {
    render(<Pagination currentPage={2} totalPages={5} basePath="/blog" />);

    const firstPageLink = screen.getByRole('button', { name: '1' });
    expect(firstPageLink).toHaveAttribute('href', '/blog');
  });

  it('2ページ目以降へのリンクはクエリパラメータ付き', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath="/blog" />);

    const secondPageLink = screen.getByRole('button', { name: '2' });
    expect(secondPageLink).toHaveAttribute('href', '/blog?page=2');
  });

  it('検索とタグの条件をページ移動後も維持する', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        basePath="/blog"
        query={{ search: 'Next.js', tags: ['AI', 'Web'] }}
      />
    );

    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute(
      'href',
      '/blog?search=Next.js&tags=AI%2CWeb&page=2'
    );
  });
});
