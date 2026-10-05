import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { BaseContentMetadata } from '@/lib/content';
import { PostHeader } from './post-header';

const createMockMetadata = (overrides: Partial<BaseContentMetadata> = {}): BaseContentMetadata => ({
  slug: 'test-post',
  title: 'テスト記事タイトル',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
  ...overrides,
});

describe('PostHeader', () => {
  it('タイトルを表示する', () => {
    render(<PostHeader metadata={createMockMetadata()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('テスト記事タイトル');
  });

  it('タグを表示する', () => {
    render(<PostHeader metadata={createMockMetadata({ tags: ['React', 'TypeScript'] })} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('公開日と更新日を区別して表示する', () => {
    render(<PostHeader metadata={createMockMetadata()} />);

    expect(screen.getByText('公開')).toBeInTheDocument();
    expect(screen.getByText('更新')).toBeInTheDocument();
    expect(screen.getByText('2025.01.01')).toBeInTheDocument();
    expect(screen.getByText('2025.01.02')).toBeInTheDocument();
  });

  it('公開日と更新日が同じ場合は更新日を表示しない', () => {
    render(<PostHeader metadata={createMockMetadata({ updatedAt: '2025-01-01T12:00:00Z' })} />);

    expect(screen.queryByText('更新')).not.toBeInTheDocument();
  });

  it('文字数をカンマ区切りで表示する', () => {
    render(<PostHeader metadata={createMockMetadata({ characterCount: 1500 })} />);
    expect(screen.getByText('1,500 文字')).toBeInTheDocument();
  });

  it('999以下の文字数はカンマなしで表示する', () => {
    render(<PostHeader metadata={createMockMetadata({ characterCount: 999 })} />);
    expect(screen.getByText('999 文字')).toBeInTheDocument();
  });

  it('10000以上の文字数にカンマを入れて表示する', () => {
    render(<PostHeader metadata={createMockMetadata({ characterCount: 10000 })} />);
    expect(screen.getByText('10,000 文字')).toBeInTheDocument();
  });

  it('1000000以上の文字数に適切にカンマを入れて表示する', () => {
    render(<PostHeader metadata={createMockMetadata({ characterCount: 1000000 })} />);
    expect(screen.getByText('1,000,000 文字')).toBeInTheDocument();
  });

  it('説明文がある場合に概要セクションを表示する', () => {
    render(<PostHeader metadata={createMockMetadata({ description: 'テスト説明文' })} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('概要');
    expect(screen.getByText('テスト説明文')).toBeInTheDocument();
  });

  it('説明文がない場合に概要セクションを表示しない', () => {
    render(<PostHeader metadata={createMockMetadata()} />);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});
