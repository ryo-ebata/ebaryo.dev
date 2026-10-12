import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WriterIdeaPanel } from './writer-idea-panel';

const idea = {
  angle: 'チーム設計を実務へつなげる。',
  audience: 'チーム設計に迷う人',
  body: '## 導入\n\n本文\n\n## 判断軸\n\n本文',
  id: 'team-design',
  noteCount: 4,
  sources: [],
  tags: ['team-design'],
  title: 'チーム設計を実践で使うための判断軸',
};

describe('WriterIdeaPanel', () => {
  it('構成を表示し、記事案を下書きへ渡す', () => {
    const onUseIdea = vi.fn();
    render(<WriterIdeaPanel ideas={[idea]} isLoading={false} onUseIdea={onUseIdea} />);
    expect(screen.getByText(idea.title)).toBeInTheDocument();
    fireEvent.click(screen.getByText('構成を見る'));
    expect(screen.getByText('判断軸')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'この構成で下書きを作る' }));
    expect(onUseIdea).toHaveBeenCalledWith(idea);
  });
});
