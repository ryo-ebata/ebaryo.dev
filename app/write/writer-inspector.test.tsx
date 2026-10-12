import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WriterInspector } from './writer-inspector';

describe('WriterInspector', () => {
  it('現在のパネルと校正件数を表示してタブを切り替える', () => {
    const onChange = vi.fn();
    const onActivateNextAction = vi.fn();
    const nextAction = { label: '根拠を追加する', panel: 'facts' as const, reason: '根拠不足' };
    const { rerender } = render(
      <WriterInspector
        isDraggingLink={false}
        lintCount={3}
        nextAction={nextAction}
        onActivateNextAction={onActivateNextAction}
        onChange={onChange}
        onClose={vi.fn()}
        panel="analysis"
      >
        <p>パネル内容</p>
      </WriterInspector>
    );

    expect(screen.getByRole('complementary', { name: '記事構成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '概要' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '校正 3' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /次にやる.*根拠を追加する/u }));
    expect(onActivateNextAction).toHaveBeenCalledWith(nextAction);

    fireEvent.click(screen.getByRole('button', { name: '公開' }));
    expect(onChange).toHaveBeenCalledWith('settings');
    fireEvent.click(screen.getByRole('button', { name: '素材' }));
    expect(onChange).toHaveBeenCalledWith('sources');

    rerender(
      <WriterInspector
        isDraggingLink={false}
        lintCount={3}
        nextAction={nextAction}
        onActivateNextAction={onActivateNextAction}
        onChange={onChange}
        onClose={vi.fn()}
        panel="hints"
      >
        <p>パネル内容</p>
      </WriterInspector>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Kindle' }));
    expect(onChange).toHaveBeenCalledWith('kindle');
    fireEvent.click(screen.getByRole('button', { name: 'Clip' }));
    expect(onChange).toHaveBeenCalledWith('clippings');
    fireEvent.click(screen.getByRole('button', { name: '記事案' }));
    expect(onChange).toHaveBeenCalledWith('ideas');
  });

  it('リンクのドラッグ中は閉じるBackdropを表示しない', () => {
    const nextAction = { label: '公開前確認', panel: 'settings' as const, reason: '準備完了' };
    const { rerender } = render(
      <WriterInspector
        isDraggingLink
        lintCount={0}
        nextAction={nextAction}
        onActivateNextAction={vi.fn()}
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
        nextAction={nextAction}
        onActivateNextAction={vi.fn()}
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
