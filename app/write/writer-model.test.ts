import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  getLintCategory,
  matchesArticlePickerMode,
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
