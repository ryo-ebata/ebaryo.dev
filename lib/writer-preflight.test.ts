import { describe, expect, test } from 'vitest';
import { createWriterPreflight } from './writer-preflight';

const completeArticle = {
  body: '本文',
  brokenInternalLinks: 0,
  eyecatch: true,
  lintChecked: true,
  lintMessages: 0,
  readerBlockers: 0,
  readerWarnings: 0,
  slug: 'article',
  tags: 'Next.js',
  title: 'タイトル',
};

describe('createWriterPreflight', () => {
  test('公開可能な記事には問題を返さない', () => {
    expect(createWriterPreflight(completeArticle).issues).toEqual([]);
  });

  test('必須項目とリンク切れをblockerにする', () => {
    const result = createWriterPreflight({
      ...completeArticle,
      brokenInternalLinks: 2,
      readerBlockers: 1,
      slug: '',
      title: '',
    });

    expect(result.blockers.map((issue) => issue.label)).toEqual([
      'タイトルがない',
      'スラッグがない',
      '2件の内部リンク先が見つからない',
      '読者理解に公開前の問題が1件ある',
    ]);
  });

  test('品質項目は公開を止めないwarningにする', () => {
    const result = createWriterPreflight({
      ...completeArticle,
      eyecatch: false,
      lintMessages: 3,
      readerWarnings: 2,
      tags: '',
    });

    expect(result.blockers).toEqual([]);
    expect(result.warnings).toHaveLength(4);
  });
});
