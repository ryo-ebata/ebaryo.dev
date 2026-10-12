import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagFilterList } from './tag-filter-list';

const tags = [
  { tag: 'React', count: 3 },
  { tag: 'TypeScript', count: 1 },
];

describe('TagFilterList', () => {
  it('タグとその件数を表示する', () => {
    render(<TagFilterList tags={tags} selectedTags={[]} onTagToggle={vi.fn()} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('選択中のタグに aria-pressed="true" を付与する', () => {
    render(<TagFilterList tags={tags} selectedTags={['React']} onTagToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /TypeScript/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('タグをクリックすると onTagToggle が呼ばれる', () => {
    const handleToggle = vi.fn();
    render(<TagFilterList tags={tags} selectedTags={[]} onTagToggle={handleToggle} />);

    fireEvent.click(screen.getByRole('button', { name: /React/ }));

    expect(handleToggle).toHaveBeenCalledWith('React');
  });

  it('空配列の場合何もレンダリングしない', () => {
    const { container } = render(
      <TagFilterList tags={[]} selectedTags={[]} onTagToggle={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('タグが多い場合は上位だけを表示し、要求時にすべて展開する', () => {
    const manyTags = Array.from({ length: 12 }, (_unused, index) => ({
      count: 12 - index,
      tag: `Tag ${index + 1}`,
    }));
    render(<TagFilterList tags={manyTags} selectedTags={[]} onTagToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Tag 10、3件' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tag 11、2件' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'すべてのタグを表示（残り2件）' }));

    expect(screen.getByRole('button', { name: 'Tag 11、2件' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'タグを折りたたむ' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('折りたたみ時も選択中のタグを隠さない', () => {
    const manyTags = Array.from({ length: 12 }, (_unused, index) => ({
      count: 12 - index,
      tag: `Tag ${index + 1}`,
    }));
    render(<TagFilterList tags={manyTags} selectedTags={['Tag 12']} onTagToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Tag 12、1件' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
