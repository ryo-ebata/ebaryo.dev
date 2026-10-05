import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArticleSummary } from './writer-model';
import { WriterTagPicker } from './writer-tag-picker';

const article = (tags: string[]): ArticleSummary => ({
  description: '',
  draft: false,
  issueDetails: {},
  issues: [],
  progress: 100,
  slug: tags.join('-'),
  stage: 'published',
  tags,
  title: '記事',
  updatedAt: '2026-10-05',
});

describe('WriterTagPicker', () => {
  it('既存タグを検索して追加する', () => {
    const onChange = vi.fn();
    render(
      <WriterTagPicker
        articles={[article(['Next.js', 'TypeScript'])]}
        onChange={onChange}
        onLimit={vi.fn()}
        value="Next.js"
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'type' } });
    fireEvent.click(screen.getByRole('option', { name: 'TypeScript既存' }));

    expect(onChange).toHaveBeenCalledWith('Next.js, TypeScript');
  });

  it('候補にないタグを新規追加する', () => {
    const onChange = vi.fn();
    render(<WriterTagPicker articles={[]} onChange={onChange} onLimit={vi.fn()} value="" />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '新規タグ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('新規タグ');
  });
});
