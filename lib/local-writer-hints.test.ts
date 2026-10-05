import { describe, expect, it } from 'vitest';
import {
  createNoteExcerpt,
  createObsidianWikiLink,
  createPublicArticleWikiLink,
  toObsidianTarget,
} from './local-writer-hints';

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
