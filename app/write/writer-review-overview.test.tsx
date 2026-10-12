import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { analyzeWriterDraft } from '@/lib/writer-analysis';
import { analyzeWriterFacts } from '@/lib/writer-facts';
import { analyzeWriterVoice } from '@/lib/writer-voice';
import { WriterReviewOverview } from './writer-review-overview';

describe('WriterReviewOverview', () => {
  it('カテゴリをまたいだ問題を一つの一覧から選べる', () => {
    const body = `### 実装

この方法は必ず改善する。`;
    const onJump = vi.fn();
    render(
      <WriterReviewOverview
        analysis={analyzeWriterDraft('記事', body)}
        facts={analyzeWriterFacts('記事', body)}
        lintMessages={[]}
        onChangePanel={vi.fn()}
        onJump={onJump}
        onJumpToLint={vi.fn()}
        voice={analyzeWriterVoice(body)}
      />
    );

    expect(screen.getByText('レビュー概要')).toBeInTheDocument();
    expect(screen.getByText('本文を600文字以上まで具体化する')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /最初の見出し/u }));
    expect(onJump).toHaveBeenCalledWith(0);
  });
});
