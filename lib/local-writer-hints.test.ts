import { describe, expect, it } from 'vitest';
import { createNoteExcerpt, toObsidianTarget } from './local-writer-hints';

describe('toObsidianTarget', () => {
  it('creates a vault-root-relative private note link', () => {
    expect(toObsidianTarget('notes/アイデア.md')).toBe('private/notes/アイデア');
  });
});

describe('createNoteExcerpt', () => {
  it('removes frontmatter and markdown decoration', () => {
    expect(createNoteExcerpt('---\ntitle: 秘密\n---\n# 見出し\n**記事の種** [[関連ノート]]')).toBe(
      '見出し 記事の種 関連ノート'
    );
  });
});
