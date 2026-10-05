import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WriterInspector } from './writer-inspector';

describe('WriterInspector', () => {
  it('現在のパネルと校正件数を表示してタブを切り替える', () => {
    const onChange = vi.fn();
    render(
      <WriterInspector
        isDraggingLink={false}
        lintCount={3}
        onChange={onChange}
        onClose={vi.fn()}
        panel="analysis"
      >
        <p>パネル内容</p>
      </WriterInspector>
    );

    expect(screen.getByRole('complementary', { name: '記事構成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '構成' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '校正 3' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '公開設定' }));
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('リンクのドラッグ中は閉じるBackdropを表示しない', () => {
    const { rerender } = render(
      <WriterInspector
        isDraggingLink
        lintCount={0}
        onChange={vi.fn()}
        onClose={vi.fn()}
        panel="hints"
      >
        <p>パネル内容</p>
      </WriterInspector>
    );

    expect(screen.queryByRole('button', { name: '記事設定を閉じる' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '記事設定を閉じる' })).toHaveLength(1);

    rerender(
      <WriterInspector
        isDraggingLink={false}
        lintCount={0}
        onChange={vi.fn()}
        onClose={vi.fn()}
        panel="hints"
      >
        <p>パネル内容</p>
      </WriterInspector>
    );

    expect(screen.getAllByRole('button', { name: '記事設定を閉じる' })).toHaveLength(2);
  });
});
