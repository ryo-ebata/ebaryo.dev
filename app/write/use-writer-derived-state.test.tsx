import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createInitialState, type ArticleSummary } from './writer-model';
import { useWriterDerivedState } from './use-writer-derived-state';

const publishedArticle: ArticleSummary = {
  description: '公開済み記事の説明',
  draft: false,
  issueDetails: {},
  issues: [],
  progress: 100,
  slug: 'published-article',
  stage: 'published',
  tags: ['Next.js'],
  title: '公開済み記事',
  updatedAt: '2026-10-01',
};

describe('useWriterDerivedState', () => {
  it('プレビュー情報とリンク候補を一貫して生成する', () => {
    const article = {
      ...createInitialState(),
      body: '# 見出し\n本文です。',
      createdAt: '2026-10-06',
      eyecatch: { url: './eyecatch.png' },
      slug: 'draft-article',
      tags: 'Next.js, TypeScript',
      title: 'テスト記事',
    };
    const { result } = renderHook(() =>
      useWriterDerivedState({
        article,
        articles: [publishedArticle],
        clippingHints: [
          {
            description: '外部記事',
            insertText: '[外部記事](https://example.com)',
            modifiedAt: '2026-10-06',
            targetLabel: 'example.com',
            title: '外部記事',
          },
        ],
        kindleHints: [
          {
            description: '著者',
            insertText: '[本](https://www.amazon.co.jp/dp/B000000000)',
            modifiedAt: '2026-10-06',
            targetLabel: 'Amazon · B000000000',
            title: '本',
          },
        ],
        lintMessages: [],
        noteHints: [
          { excerpt: 'メモ本文', modifiedAt: '2026-10-06', target: 'private-note', title: 'メモ' },
        ],
      })
    );

    expect(result.current.previewMetadata.eyecatch?.url).toBe(
      '/blog-assets/draft-article/eyecatch.png'
    );
    expect(result.current.previewMetadata.tags).toEqual(['Next.js', 'TypeScript']);
    expect(result.current.publicArticleLinkItems[0]?.insertText).toContain('published-article');
    expect(result.current.noteLinkItems[0]?.insertText).toContain('private-note');
    expect(result.current.kindleLinkItems[0]?.insertText).toContain('amazon.co.jp');
    expect(result.current.clippingLinkItems[0]?.insertText).toContain('example.com');
  });
});
