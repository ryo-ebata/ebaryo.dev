import { describe, expect, test } from 'vitest';
import { analyzeWriterLibrary, type WriterLibrarySource } from './writer-library';

const article = (overrides: Partial<WriterLibrarySource> = {}): WriterLibrarySource => ({
  body: '本文'.repeat(500),
  description: '説明',
  draft: false,
  eyecatch: true,
  slug: 'article',
  tags: ['技術'],
  title: '記事',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

describe('analyzeWriterLibrary', () => {
  test('下書きの進行段階を本文量から推定する', () => {
    const result = analyzeWriterLibrary([
      article({ body: 'メモ', draft: true, slug: 'idea' }),
      article({ body: '本文'.repeat(150), draft: true, slug: 'writing' }),
      article({ body: '本文'.repeat(500), draft: true, slug: 'review' }),
    ]);

    expect(result.get('idea')?.stage).toBe('idea');
    expect(result.get('writing')?.stage).toBe('writing');
    expect(result.get('review')?.stage).toBe('review');
  });

  test('古さ、情報不足、孤立、リンク切れを検出する', () => {
    const result = analyzeWriterLibrary(
      [
        article({
          body: '[不明](/blog/missing)',
          description: '',
          eyecatch: false,
          slug: 'old-post',
          tags: [],
          updatedAt: '2024-01-01T00:00:00.000Z',
        }),
        article({ slug: 'another-post' }),
      ],
      new Date('2026-10-03T00:00:00.000Z')
    );

    expect(result.get('old-post')?.issues).toEqual([
      'stale',
      'missing-eyecatch',
      'missing-tags',
      'short-content',
      'orphaned',
      'broken-link',
    ]);
    expect(result.get('old-post')?.issueDetails).toMatchObject({
      'broken-link': '存在しない記事へのリンク: /blog/missing',
      'missing-eyecatch': 'サムネイル画像が設定されていない',
      'missing-tags': '分類に使うタグが1件も設定されていない',
      orphaned: 'ほかの記事からこの記事への内部リンクがない',
      'short-content': '本文が19文字で、目安の600文字に届いていない',
    });
  });

  test('他記事からリンクされていれば孤立扱いしない', () => {
    const result = analyzeWriterLibrary([
      article({ slug: 'target' }),
      article({ body: '[対象](/blog/target)', slug: 'source' }),
    ]);

    expect(result.get('target')?.issues).not.toContain('orphaned');
  });
});
