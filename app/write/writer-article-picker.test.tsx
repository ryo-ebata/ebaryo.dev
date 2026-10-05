import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArticleSummary } from './writer-model';
import { WriterArticlePicker } from './writer-article-picker';

const article = (overrides: Partial<ArticleSummary>): ArticleSummary => ({
  description: '説明',
  draft: false,
  issueDetails: {},
  issues: [],
  progress: 100,
  slug: 'published-post',
  stage: 'published',
  tags: [],
  title: '公開記事',
  updatedAt: '2026-10-05',
  ...overrides,
});

describe('WriterArticlePicker', () => {
  it('検索結果から記事を開いて一覧を閉じる', async () => {
    const onOpenArticle = vi.fn(() => Promise.resolve(true));
    render(
      <WriterArticlePicker
        articles={[
          article({}),
          article({ draft: true, slug: 'draft-post', stage: 'writing', title: '下書き記事' }),
        ]}
        currentSlug="published-post"
        currentTitle="公開記事"
        onNewArticle={() => true}
        onOpenArticle={onOpenArticle}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /公開記事/ }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '下書き' } });
    fireEvent.click(screen.getByRole('button', { name: /下書き記事/ }));

    await waitFor(() => expect(onOpenArticle).toHaveBeenCalledWith('draft-post'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('記事切替が拒否された場合は一覧を維持する', async () => {
    render(
      <WriterArticlePicker
        articles={[article({})]}
        currentTitle=""
        onNewArticle={() => false}
        onOpenArticle={() => Promise.resolve(false)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /記事を開く/ }));
    fireEvent.click(screen.getByRole('button', { name: /公開記事/ }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });
});
