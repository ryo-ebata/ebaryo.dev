import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { analyzeWriterFacts } from '@/lib/writer-facts';
import { WriterFactPanel } from './writer-fact-panel';

describe('WriterFactPanel', () => {
  it('読者レビューを切り替えて主張位置へ移動する', () => {
    const analysis = analyzeWriterFacts(
      '完全な方法',
      `## 概要

この方法は常に効率的である。`
    );
    const onJump = vi.fn();
    const onAddResearchNote = vi.fn();
    const onInsertEvidence = vi.fn();
    const onMarkAsOpinion = vi.fn();
    render(
      <WriterFactPanel
        analysis={analysis}
        evidenceSuggestions={{
          [analysis.claims[0].offset]: [
            {
              description: '効率化の実践例',
              id: 'efficiency-note',
              insertText: '[[efficiency-note|効率化の記録]]',
              role: 'example',
              score: 4,
              sourceType: 'note',
              title: '効率化の記録',
            },
          ],
        }}
        onAddResearchNote={onAddResearchNote}
        onInsertEvidence={onInsertEvidence}
        onJump={onJump}
        onMarkAsOpinion={onMarkAsOpinion}
      />
    );

    expect(screen.getByText('確認が必要な主張')).toBeInTheDocument();
    expect(screen.getByText('調査キュー')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '実践者' }));
    expect(screen.getByText('適用できる環境と前提条件を明記する')).toBeInTheDocument();
    const matchingButtons = screen.getAllByRole('button', {
      name: /この方法は常に効率的である/u,
    });
    fireEvent.click(matchingButtons.at(-1) as HTMLButtonElement);
    expect(onJump).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /効率化の記録/u }));
    expect(onInsertEvidence).toHaveBeenCalledWith(
      '[[efficiency-note|効率化の記録]]',
      analysis.claims[0].insertionOffset
    );
    fireEvent.click(screen.getByRole('button', { name: '見解と明示' }));
    expect(onMarkAsOpinion).toHaveBeenCalledWith(analysis.claims[0].offset);
  });
});
