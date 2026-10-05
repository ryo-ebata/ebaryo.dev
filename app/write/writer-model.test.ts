import { describe, expect, it } from 'vitest';
import {
  collectWriterTags,
  createInitialState,
  filterWriterTagSuggestions,
  getLintCategory,
  matchesArticlePickerMode,
  normalizeWriterDate,
  parseWriterTags,
  type ArticleSummary,
} from './writer-model';

const createArticle = (overrides: Partial<ArticleSummary> = {}): ArticleSummary => ({
  description: '',
  draft: true,
  issueDetails: {},
  issues: [],
  progress: 50,
  slug: 'example',
  stage: 'writing',
  tags: [],
  title: '記事',
  updatedAt: '2026-10-05',
  ...overrides,
});

describe('createInitialState', () => {
  it('新規記事を下書きとして作る', () => {
    const state = createInitialState();

    expect(state.draft).toBe(true);
    expect(state.body).toBe('');
    expect(state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
  });
});

describe('normalizeWriterDate', () => {
  it('ISO日時は日付部分へ正規化する', () => {
    expect(normalizeWriterDate('2026-10-05T12:34:56.000Z')).toBe('2026-10-05');
  });

  it('不正な日付は今日へ戻す', () => {
    expect(normalizeWriterDate('Invalid ISO date')).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe('getLintCategory', () => {
  it.each([
    ['ai-words-ja/no-ai-list-formatting', 'AIらしさ'],
    ['prh', '表記'],
    ['sentence-length', '読みやすさ'],
    ['no-zero-width-spaces', '文字'],
    ['ja-no-abusage', '日本語'],
  ])('%sを%sへ分類する', (ruleId, category) => {
    expect(getLintCategory(ruleId)).toBe(category);
  });
});

describe('matchesArticlePickerMode', () => {
  it('公開済みと下書きを分離する', () => {
    expect(matchesArticlePickerMode(createArticle({ draft: false }), 'published')).toBe(true);
    expect(matchesArticlePickerMode(createArticle(), 'published')).toBe(false);
  });

  it('問題がある公開記事だけを要メンテに含める', () => {
    expect(
      matchesArticlePickerMode(
        createArticle({ draft: false, issues: ['missing-eyecatch'] }),
        'maintenance'
      )
    ).toBe(true);
    expect(matchesArticlePickerMode(createArticle({ draft: false }), 'maintenance')).toBe(false);
  });
});

describe('writer tags', () => {
  it('記事群から既存タグを重複なく収集する', () => {
    expect(
      collectWriterTags([
        createArticle({ slug: 'first', tags: ['Next.js', 'TypeScript'] }),
        createArticle({ slug: 'second', tags: ['TypeScript', 'ブログ'] }),
      ])
    ).toEqual(['Next.js', 'TypeScript', 'ブログ']);
  });

  it('選択済みタグを除外して検索する', () => {
    expect(
      filterWriterTagSuggestions(['Next.js', 'React', 'TypeScript'], ['Next.js'], 'type')
    ).toEqual(['TypeScript']);
  });

  it('カンマ区切り文字列をタグへ変換する', () => {
    expect(parseWriterTags('Next.js, TypeScript,  ブログ ')).toEqual([
      'Next.js',
      'TypeScript',
      'ブログ',
    ]);
  });
});
