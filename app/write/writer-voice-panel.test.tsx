import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WriterVoicePanel } from './writer-voice-panel';

describe('WriterVoicePanel', () => {
  it('過去記事との比較と指摘位置への移動を表示する', () => {
    const onJump = vi.fn();
    render(
      <WriterVoicePanel
        analysis={{
          baseline: {
            averageSentenceLength: 30,
            bulletRatio: 0.1,
            sentenceCount: 120,
            sentenceLengthVariation: 0.4,
          },
          findings: [{ offset: 20, text: '定型表現を具体化する', type: 'ai-pattern' }],
          profile: {
            averageSentenceLength: 50,
            bulletRatio: 0.1,
            sentenceCount: 10,
            sentenceLengthVariation: 0.2,
          },
        }}
        onJump={onJump}
      />
    );

    expect(screen.getByText('公開済み 120文を基準')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /定型表現を具体化する/u }));
    expect(onJump).toHaveBeenCalledWith(20);
  });
});
