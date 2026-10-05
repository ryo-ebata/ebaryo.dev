import { describe, expect, it } from 'vitest';
import { normalizeWriterMarkdown } from './writer-markdown';

describe('normalizeWriterMarkdown', () => {
  it('removes legacy angle brackets from automatic links', () => {
    expect(normalizeWriterMarkdown('読む: <https://rikyu.ai/>')).toBe('読む: https://rikyu.ai/');
  });

  it('keeps ordinary HTML intact', () => {
    expect(normalizeWriterMarkdown('<details>本文</details>')).toBe('<details>本文</details>');
  });

  it('Amazon商品URLへ設定済みタグを付与する', () => {
    expect(
      normalizeWriterMarkdown(
        '[本](https://www.amazon.co.jp/商品/dp/4776209365?ref_=abc)',
        'error99-22'
      )
    ).toBe('[本](https://www.amazon.co.jp/dp/4776209365?tag=error99-22)');
  });

  it('コードブロックとインラインコード内は変更しない', () => {
    const source =
      '`https://www.amazon.co.jp/dp/4776209365`\n```txt\nhttps://www.amazon.co.jp/dp/4776209365\n```';
    expect(normalizeWriterMarkdown(source)).toBe(source);
  });
});
