import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LintMessage } from './writer-model';
import { WriterReviewPanel } from './writer-review-panel';

const body = '悪い表現です。\n次の段落';
const messages: LintMessage[] = [
  {
    column: 1,
    fix: { range: [0, 2], text: '良い' },
    line: 1,
    message: '表現を見直す',
    range: [0, 4],
    ruleId: 'prh',
    severity: 2,
    suggestions: [
      {
        fix: { range: [2, 4], text: '文章' },
        id: 'suggestion-1',
        message: '「文章」に変更',
      },
    ],
  },
];

describe('WriterReviewPanel', () => {
  it('指摘位置への移動と再校正を通知する', () => {
    const onJump = vi.fn();
    const onRunLint = vi.fn();
    render(
      <WriterReviewPanel
        body={body}
        isLinting={false}
        messages={messages}
        onApplyEdit={vi.fn()}
        onJump={onJump}
        onRunLint={onRunLint}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /1行目/u }));
    fireEvent.click(screen.getByRole('button', { name: 'もう一度確認' }));

    expect(onJump).toHaveBeenCalledWith(0);
    expect(onRunLint).toHaveBeenCalledOnce();
  });

  it('自動修正をMarkdown編集命令へ変換する', () => {
    const onApplyEdit = vi.fn();
    render(
      <WriterReviewPanel
        body={body}
        isLinting={false}
        messages={messages}
        onApplyEdit={onApplyEdit}
        onJump={vi.fn()}
        onRunLint={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '「良い」へ修正' }));

    expect(onApplyEdit).toHaveBeenCalledWith(
      {
        selectionEnd: 2,
        selectionStart: 2,
        value: '良い表現です。\n次の段落',
      },
      0
    );
  });
});
