import { describe, expect, it } from 'vitest';
import { isAmazonJapanUrl, toAmazonAffiliateUrl } from './amazon-affiliate';

describe('toAmazonAffiliateUrl', () => {
  it('商品URLを短いアフィリエイトURLへ変換する', () => {
    expect(
      toAmazonAffiliateUrl(
        'https://www.amazon.co.jp/商品名/dp/4776209365?ref_=abc&tag=old-22',
        'error99-22'
      )
    ).toBe('https://www.amazon.co.jp/dp/4776209365?tag=error99-22');
  });

  it('gp/product形式からASINを抽出する', () => {
    expect(toAmazonAffiliateUrl('https://amazon.co.jp/gp/product/B012345678/', 'error99-22')).toBe(
      'https://www.amazon.co.jp/dp/B012345678?tag=error99-22'
    );
  });

  it('検索URLには既存条件を残してタグを付与する', () => {
    expect(toAmazonAffiliateUrl('https://www.amazon.co.jp/s?k=本', 'error99-22')).toContain(
      'k=%E6%9C%AC&tag=error99-22'
    );
  });

  it('タグ未設定なら変更しない', () => {
    const url = 'https://www.amazon.co.jp/dp/4776209365';
    expect(toAmazonAffiliateUrl(url, '')).toBe(url);
  });

  it('他国Amazonと短縮URLは変更しない', () => {
    expect(toAmazonAffiliateUrl('https://www.amazon.com/dp/B012345678', 'error99-22')).toBe(
      'https://www.amazon.com/dp/B012345678'
    );
    expect(toAmazonAffiliateUrl('https://amzn.to/example', 'error99-22')).toBe(
      'https://amzn.to/example'
    );
  });
});

describe('isAmazonJapanUrl', () => {
  it('Amazon.co.jpのサブドメインを判定する', () => {
    expect(isAmazonJapanUrl('https://www.amazon.co.jp/dp/4776209365')).toBe(true);
    expect(isAmazonJapanUrl('https://example.com/?next=amazon.co.jp')).toBe(false);
  });
});
