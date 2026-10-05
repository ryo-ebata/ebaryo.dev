import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './writer-model';
import { WriterMetadataSettings } from './writer-metadata-settings';

const renderSettings = (currentSlug?: string) => {
  const onApplyAutomaticSeo = vi.fn();
  const onChangePublicationMode = vi.fn();
  const onUpdate = vi.fn();
  const article = {
    ...createInitialState(),
    body: '記事本文',
    description: '記事の説明',
    slug: 'existing-article',
    title: '既存記事',
  };

  render(
    <WriterMetadataSettings
      article={article}
      articles={[]}
      automaticSeo={{
        description: article.description,
        eyecatch: null,
        seoTitle: article.title,
      }}
      currentSlug={currentSlug}
      descriptionState="good"
      onApplyAutomaticSeo={onApplyAutomaticSeo}
      onChangePublicationMode={onChangePublicationMode}
      onTagLimit={vi.fn()}
      onUpdate={onUpdate}
      publicationMode="draft"
      publicUrl="https://ebaryo.dev/blog/existing-article"
      seoTitleState="good"
      today="2026-10-05"
    />
  );

  return { onApplyAutomaticSeo, onChangePublicationMode, onUpdate };
};

describe('WriterMetadataSettings', () => {
  it('公開モードと記事情報の変更を通知する', () => {
    const { onChangePublicationMode, onUpdate } = renderSettings();

    fireEvent.click(screen.getByRole('button', { name: /今すぐ公開/u }));
    fireEvent.change(screen.getByRole('textbox', { name: /^説明/u }), {
      target: { value: '更新した説明' },
    });

    expect(onChangePublicationMode).toHaveBeenCalledWith('published');
    expect(onUpdate).toHaveBeenCalledWith('description', '更新した説明');
  });

  it('既存記事のslugを固定してSEO自動設定を実行する', () => {
    const { onApplyAutomaticSeo } = renderSettings('existing-article');

    expect(screen.getByRole('textbox', { name: 'スラッグ' })).toBeDisabled();

    fireEvent.click(screen.getByText('検索と共有の詳細'));
    fireEvent.click(screen.getByRole('button', { name: '自動設定を反映' }));

    expect(onApplyAutomaticSeo).toHaveBeenCalledOnce();
  });
});
