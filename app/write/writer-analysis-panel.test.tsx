import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WriterAnalysis } from '@/lib/writer-analysis';
import { WriterAnalysisPanel } from './writer-analysis-panel';

const analysis: WriterAnalysis = {
  brokenInternalLinks: [],
  externalLinks: 1,
  findings: [{ offset: 24, text: '段落を分割する', type: 'improve' }],
  headings: [{ level: 2, offset: 12, text: '概要' }],
  images: 1,
  internalLinks: 2,
  paragraphCount: 3,
  readingMinutes: 4,
};

const relatedArticles = [
  {
    description: '関連する説明',
    draft: false,
    score: 8,
    slug: 'related-article',
    tags: ['TypeScript'],
    title: '関連記事',
  },
];

describe('WriterAnalysisPanel', () => {
  it('執筆段階を切り替えて本文位置へ移動する', () => {
    const onChangeStage = vi.fn();
    const onJump = vi.fn();
    render(
      <WriterAnalysisPanel
        analysis={analysis}
        onChangeStage={onChangeStage}
        onInsertBlock={vi.fn()}
        onInsertRelatedArticle={vi.fn()}
        onJump={onJump}
        relatedArticles={relatedArticles}
        stage="outline"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '推敲' }));
    fireEvent.click(screen.getByRole('button', { name: 'H2概要' }));

    expect(onChangeStage).toHaveBeenCalledWith('review');
    expect(onJump).toHaveBeenCalledWith(12);
  });

  it('関連記事と執筆ブロックの追加を通知する', () => {
    const onInsertBlock = vi.fn();
    const onInsertRelatedArticle = vi.fn();
    render(
      <WriterAnalysisPanel
        analysis={analysis}
        onChangeStage={vi.fn()}
        onInsertBlock={onInsertBlock}
        onInsertRelatedArticle={onInsertRelatedArticle}
        onJump={vi.fn()}
        relatedArticles={relatedArticles}
        stage="outline"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /関連記事/u }));
    fireEvent.click(screen.getByRole('button', { name: '導入' }));

    expect(onInsertRelatedArticle).toHaveBeenCalledWith(relatedArticles[0]);
    expect(onInsertBlock).toHaveBeenCalledWith(
      expect.objectContaining({ label: '導入', text: expect.stringContaining('## はじめに') })
    );
  });
});
