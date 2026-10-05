import { describe, expect, test } from 'vitest';
import { analyzeWriterDraft, findRelatedWriterArticles } from './writer-analysis';

describe('analyzeWriterDraft', () => {
  test('本文の構造とリンクを集計する', () => {
    const body = `導入文です。

## 概要

本文です。[[private/memo]]を参照する。

### 詳細

![図](./diagram.png)

[外部](https://example.com)`;
    const result = analyzeWriterDraft('適切な記事タイトル', body);

    expect(result.headings).toEqual([
      { level: 2, offset: 8, text: '概要' },
      { level: 3, offset: 44, text: '詳細' },
    ]);
    expect(result.internalLinks).toBe(1);
    expect(result.externalLinks).toBe(1);
    expect(result.images).toBe(1);
    expect(result.paragraphCount).toBe(3);
  });

  test('見出し階層、長文段落、画像altの問題を返す', () => {
    const body = `## 最初

${'長い文章'.repeat(80)}

#### 飛んだ見出し

![](./image.png)`;
    const result = analyzeWriterDraft('タイトル', body);
    const findings = result.findings.map((finding) => finding.text);

    expect(findings).toContain('「飛んだ見出し」の見出しレベルが飛んでいる');
    expect(findings).toContain('300文字を超える段落を分割する');
    expect(findings).toContain('説明のない画像に代替テキストを付ける');
  });

  test('コードブロック内の見出しを無視する', () => {
    const result = analyzeWriterDraft(
      'タイトル',
      '```md\n## コード内\n```\n\n## 本文の見出し\n\n本文'
    );

    expect(result.headings).toHaveLength(1);
    expect(result.headings[0].text).toBe('本文の見出し');
  });

  test('重複見出しと存在しない内部リンクを検出する', () => {
    const result = analyzeWriterDraft(
      'タイトル',
      '## 同じ見出し\n\n本文\n\n## 同じ見出し\n\n[存在しない](/blog/missing-post)',
      ['existing-post']
    );

    expect(result.brokenInternalLinks).toEqual([{ offset: 24, url: '/blog/missing-post' }]);
    expect(result.findings.map((finding) => finding.text)).toContain(
      '「同じ見出し」の見出しが重複している'
    );
    expect(result.findings.map((finding) => finding.text)).toContain(
      '1件の内部リンク先が見つからない'
    );
  });
});

describe('findRelatedWriterArticles', () => {
  test('タグと内容が近い公開記事を優先する', () => {
    const result = findRelatedWriterArticles(
      {
        body: 'Next.jsでブログのキャッシュを改善する。',
        currentSlug: 'current',
        tags: 'Next.js, キャッシュ',
        title: 'Next.jsのキャッシュ設計',
      },
      [
        {
          description: 'キャッシュの設計を解説する',
          draft: false,
          slug: 'cache-design',
          tags: ['Next.js', 'キャッシュ'],
          title: 'Next.jsキャッシュ設計入門',
        },
        {
          description: 'CSSについて',
          draft: false,
          slug: 'css-design',
          tags: ['CSS'],
          title: 'CSS設計',
        },
        {
          description: '非公開記事',
          draft: true,
          slug: 'private-cache',
          tags: ['Next.js'],
          title: '非公開のキャッシュ記事',
        },
      ]
    );

    expect(result.map((article) => article.slug)).toEqual(['cache-design']);
  });

  test('本文にリンク済みの記事を除外する', () => {
    const result = findRelatedWriterArticles(
      {
        body: '[関連記事](/blog/cache-design)',
        tags: 'Next.js',
        title: 'Next.js',
      },
      [
        {
          description: '関連記事',
          draft: false,
          slug: 'cache-design',
          tags: ['Next.js'],
          title: 'Next.jsキャッシュ',
        },
      ]
    );

    expect(result).toEqual([]);
  });
});
