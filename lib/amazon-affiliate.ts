import { adsConfig } from '@/config/ads';

const AMAZON_JP_HOST_PATTERN = /(?:^|\.)amazon\.co\.jp$/iu;
const PRODUCT_PATH_PATTERN = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/iu;

export const isAmazonJapanUrl = (value: string): boolean => {
  try {
    return AMAZON_JP_HOST_PATTERN.test(new URL(value).hostname);
  } catch {
    return false;
  }
};

export const toAmazonAffiliateUrl = (
  value: string,
  associateTag = adsConfig.affiliate.amazonTag
): string => {
  if (!associateTag) return value;

  try {
    const url = new URL(value);
    if (!AMAZON_JP_HOST_PATTERN.test(url.hostname)) return value;

    const asin = url.pathname.match(PRODUCT_PATH_PATTERN)?.[1]?.toUpperCase();
    if (asin) {
      const canonical = new URL(`https://www.amazon.co.jp/dp/${asin}`);
      canonical.searchParams.set('tag', associateTag);
      return canonical.toString();
    }

    url.searchParams.set('tag', associateTag);
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
};
