import { toAmazonAffiliateUrl } from './amazon-affiliate';

export const WRITER_INSERT_MIME = 'application/x-writer-insert';

export const isObsidianDailyNotePath = (relativePath: string) =>
  relativePath.replaceAll('\\', '/').replace(/^\/+/, '').split('/')[0]?.toLowerCase() === 'daily';

export const toObsidianTarget = (relativePath: string) =>
  `private/${relativePath.replaceAll('\\', '/').replace(/^\/+|\.md$/gi, '')}`;

export const createObsidianWikiLink = (target: string, title: string) =>
  `[[${target}|${title.replaceAll('|', ' ')}]]`;

export const createPublicArticleWikiLink = (slug: string, title: string) =>
  createObsidianWikiLink(`public/blogs/${slug}/index`, title);

const escapeMarkdownLabel = (value: string) => value.replaceAll('[', '［').replaceAll(']', '］');

export const createKindleAffiliateMarkdown = (
  asin: string,
  title: string,
  associateTag?: string
) => {
  const productUrl = `https://www.amazon.co.jp/dp/${encodeURIComponent(asin.trim())}`;
  return `[${escapeMarkdownLabel(title)}](${toAmazonAffiliateUrl(productUrl, associateTag)})`;
};

export const createClippingLinkMarkdown = (url: string, title: string) =>
  `[${escapeMarkdownLabel(title)}](${url})`;

export const createNoteExcerpt = (source: string, maxLength = 120) => {
  const plainText = source
    .replace(/^---[\s\S]*?---\s*/u, '')
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, '$2 $1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/[*_~`>|-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  return plainText.length > maxLength ? `${plainText.slice(0, maxLength).trimEnd()}…` : plainText;
};
