import { describe, expect, it } from 'vitest';
import {
  createClippingLinkMarkdown,
  createKindleAffiliateMarkdown,
  createNoteExcerpt,
  createObsidianWikiLink,
  createPublicArticleWikiLink,
  isObsidianDailyNotePath,
  toObsidianTarget,
} from './local-writer-hints';

describe('writer source links', () => {
  it('KindleのASINから日本Amazonの商品リンクを作る', () => {
    expect(createKindleAffiliateMarkdown('B0C231J7FC', 'スタッフエンジニア', 'error99-22')).toBe(
      '[スタッフエンジニア](https://www.amazon.co.jp/dp/B0C231J7FC?tag=error99-22)'
    );
  });

  it('Clippingの元URLから外部リンクを作る', () => {
    expect(createClippingLinkMarkdown('https://example.com/article', '記事 [保存版]')).toBe(
      '[記事 ［保存版］](https://example.com/article)'
    );
  });
});

describe('isObsidianDailyNotePath', () => {
  it('private直下のdailyディレクトリだけを判定する', () => {
    expect(isObsidianDailyNotePath('daily/2026-10-07.md')).toBe(true);
    expect(isObsidianDailyNotePath('daily\\2026-10-07.md')).toBe(true);
    expect(isObsidianDailyNotePath('notes/daily/設計メモ.md')).toBe(false);
    expect(isObsidianDailyNotePath('notes/2026-10-07.md')).toBe(false);
  });
});

describe('toObsidianTarget', () => {
  it('creates a vault-root-relative private note link', () => {
    expect(toObsidianTarget('notes/アイデア.md')).toBe('private/notes/アイデア');
  });
});

describe('createObsidianWikiLink', () => {
  it('公開時に表示するノートタイトルを別名として保持する', () => {
    expect(createObsidianWikiLink('private/notes/idea', '記事のアイデア')).toBe(
      '[[private/notes/idea|記事のアイデア]]'
    );
  });
});

describe('createPublicArticleWikiLink', () => {
  it('公開記事を解決可能なWikiリンクにする', () => {
    expect(createPublicArticleWikiLink('example-article', '公開記事')).toBe(
      '[[public/blogs/example-article/index|公開記事]]'
    );
  });
});

describe('createNoteExcerpt', () => {
  it('removes frontmatter and markdown decoration', () => {
    expect(createNoteExcerpt('---\ntitle: 秘密\n---\n# 見出し\n**記事の種** [[関連ノート]]')).toBe(
      '見出し 記事の種 関連ノート'
    );
  });
});
