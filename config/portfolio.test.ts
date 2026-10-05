import { describe, expect, it } from 'vitest';
import { portfolioItems, portfolioItemsSchema } from './portfolio';

describe('portfolioItemsSchema', () => {
  it('公開中のポートフォリオデータを検証できる', () => {
    expect(portfolioItemsSchema.parse(portfolioItems)).toEqual(portfolioItems);
  });

  it('URLとして不正なリンクを拒否する', () => {
    expect(() =>
      portfolioItemsSchema.parse([
        {
          category: 'talk',
          description: '登壇内容',
          links: [{ href: 'invalid', label: 'Slide' }],
          role: 'Speaker',
          tags: [],
          title: '登壇タイトル',
          year: 2026,
        },
      ])
    ).toThrow();
  });
});
