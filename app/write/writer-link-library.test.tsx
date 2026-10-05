import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WriterLinkLibrary } from './writer-link-library';

const items = [
  {
    description: '記事の説明',
    id: 'article',
    searchText: '公開記事 TypeScript',
    targetLabel: '/blog/article',
    title: '公開記事',
    wikiLink: '[[public/blogs/article/index|公開記事]]',
  },
];

describe('WriterLinkLibrary', () => {
  it('検索結果からWikiリンクを挿入する', () => {
    const onInsert = vi.fn();
    render(
      <WriterLinkLibrary
        emptyLabel="なし"
        guide="ガイド"
        items={items}
        onDragStateChange={vi.fn()}
        onInsert={onInsert}
        searchLabel="記事検索"
        searchPlaceholder="検索"
      />
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'TypeScript' } });
    fireEvent.click(screen.getByRole('button', { name: /公開記事/u }));

    expect(onInsert).toHaveBeenCalledWith('[[public/blogs/article/index|公開記事]]');
  });

  it('一致しない場合は空表示する', () => {
    render(
      <WriterLinkLibrary
        emptyLabel="該当なし"
        guide="ガイド"
        items={items}
        onDragStateChange={vi.fn()}
        onInsert={vi.fn()}
        searchLabel="記事検索"
        searchPlaceholder="検索"
      />
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Rust' } });
    expect(screen.getByText('該当なし')).toBeInTheDocument();
  });
});
