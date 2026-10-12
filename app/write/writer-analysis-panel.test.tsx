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
  readerExperience: {
    blockers: [],
    findings: [
      {
        category: 'clarity',
        level: 'warning',
        offset: 24,
        suggestion: '主張ごとに分ける',
        text: '長い段落を分割する',
      },
    ],
    hints: [],
    score: 90,
    warnings: [
      {
        category: 'clarity',
        level: 'warning',
        offset: 24,
        suggestion: '主張ごとに分ける',
        text: '長い段落を分割する',
      },
    ],
  },
  gaps: [],
  sections: [
    {
      characterCount: 80,
      claim: '概要を説明する。',
      evidence: [],
      heading: '概要',
      level: 2,
      nextAction: '判断理由か具体例を足す',
      offset: 12,
      status: 'outline',
    },
  ],
  nextSection: {
    characterCount: 80,
    claim: '概要を説明する。',
    evidence: [],
    heading: '概要',
    level: 2,
    nextAction: '判断理由か具体例を足す',
    offset: 12,
    status: 'outline',
  },
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
  it('章から本文位置へ移動する', () => {
    const onJump = vi.fn();
    render(
      <WriterAnalysisPanel
        analysis={analysis}
        onInsertBlock={vi.fn()}
        onInsertRelatedArticle={vi.fn()}
        onJump={onJump}
        relatedArticles={relatedArticles}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /概要.*要点のみ/u }));

    expect(onJump).toHaveBeenCalledWith(12);
  });

  it('関連記事と執筆ブロックの追加を通知する', () => {
    const onInsertBlock = vi.fn();
    const onInsertRelatedArticle = vi.fn();
    render(
      <WriterAnalysisPanel
        analysis={analysis}
        onInsertBlock={onInsertBlock}
        onInsertRelatedArticle={onInsertRelatedArticle}
        onJump={vi.fn()}
        relatedArticles={relatedArticles}
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
