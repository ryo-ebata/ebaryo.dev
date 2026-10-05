import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './writer-model';
import { WriterThumbnailSettings } from './writer-thumbnail-settings';

const article = {
  ...createInitialState(),
  createdAt: '2026-10-05',
  slug: 'thumbnail-test',
  tags: 'TypeScript, Next.js',
  title: 'サムネイルのテスト',
};

describe('WriterThumbnailSettings', () => {
  it('選択したプリセットでサムネイルを生成する', () => {
    const onGenerate = vi.fn();
    render(
      <WriterThumbnailSettings
        article={article}
        automaticTitle="SEOタイトル"
        isGenerating={false}
        onGenerate={onGenerate}
        onUpdateEyecatch={vi.fn()}
        onUploadEyecatch={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /技術/u }));
    fireEvent.click(screen.getByRole('button', { name: 'このデザインで自動生成' }));

    expect(onGenerate).toHaveBeenCalledWith({
      date: '2026-10-05',
      layout: 'split',
      motif: 'native',
      subtitle: 'Web開発',
      title: 'SEOタイトル',
      variant: 'indigo',
    });
  });

  it('サムネイル画像を選択して削除できる', () => {
    const onUpdateEyecatch = vi.fn();
    const onUploadEyecatch = vi.fn();
    const file = new File(['image'], 'thumbnail.png', { type: 'image/png' });
    render(
      <WriterThumbnailSettings
        article={{ ...article, eyecatch: { alt: '画像', url: 'thumbnail.png' } }}
        automaticTitle="SEOタイトル"
        isGenerating={false}
        onGenerate={vi.fn()}
        onUpdateEyecatch={onUpdateEyecatch}
        onUploadEyecatch={onUploadEyecatch}
      />
    );

    fireEvent.change(screen.getByLabelText('画像を変更'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: '削除' }));

    expect(onUploadEyecatch).toHaveBeenCalledWith(file);
    expect(onUpdateEyecatch).toHaveBeenCalledWith(null);
  });
});
