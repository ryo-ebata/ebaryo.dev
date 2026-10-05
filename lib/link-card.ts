import { siteConfig } from '@/config/site';
import { toAmazonAffiliateUrl } from '@/lib/amazon-affiliate';

export type LinkCardKind = 'external' | 'internal';

export interface LinkCardTarget {
  display: string;
  href: string;
  kind: LinkCardKind;
}

export interface LinkCardMetadata {
  description?: string;
  image?: string;
  siteName: string;
  title: string;
}

export const classifyLinkCardUrl = (url: string): LinkCardTarget | null => {
  const value = toAmazonAffiliateUrl(url.trim());
  if (value.startsWith('/blog/')) {
    return { display: value, href: value, kind: 'internal' };
  }
  if (!/^https?:\/\//u.test(value)) return null;

  try {
    const parsed = new URL(value);
    const site = new URL(siteConfig.url);
    const internal = parsed.origin === site.origin && parsed.pathname.startsWith('/blog/');
    return {
      display: internal ? parsed.pathname : parsed.hostname,
      href: internal ? `${parsed.pathname}${parsed.search}${parsed.hash}` : value,
      kind: internal ? 'internal' : 'external',
    };
  } catch {
    return null;
  }
};
