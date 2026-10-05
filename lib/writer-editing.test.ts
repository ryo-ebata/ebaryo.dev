import { describe, expect, it } from 'vitest';
import { continueMarkdownLine, formatInlineMarkdown, prefixMarkdownLines } from './writer-editing';

describe('formatInlineMarkdown', () => {
  it('wraps selected text in bold syntax', () => {
    expect(formatInlineMarkdown('文章を強調する', 3, 5, 'bold').value).toBe('文章を**強調**する');
  });

  it('inserts a useful link template', () => {
    expect(formatInlineMarkdown('', 0, 0, 'link').value).toBe('[リンク名](https://)');
  });
});

describe('prefixMarkdownLines', () => {
  it('prefixes every selected line', () => {
    expect(prefixMarkdownLines('一行目\n二行目', 0, 7, '> ').value).toBe('> 一行目\n> 二行目');
  });
});

describe('continueMarkdownLine', () => {
  it('continues and increments numbered lists', () => {
    expect(continueMarkdownLine('1. 最初', 5)?.value).toBe('1. 最初\n2. ');
  });

  it('ends an empty list', () => {
    expect(continueMarkdownLine('- ', 2)?.value).toBe('');
  });
});
