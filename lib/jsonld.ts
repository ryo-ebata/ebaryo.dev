import type { BaseContentMetadata } from './content';
import { siteConfig } from '@/config/site';
import { resolveArticleDescription, resolveArticleImageUrl } from './metadata';

const EMPTY_LENGTH = 0;

/**
 * ブログ記事用のJSON-LDスキーマを生成
 */
export const generateArticleJsonLd = (
  metadata: BaseContentMetadata,
  url: string,
  contentHtml?: string
): Record<string, unknown> => {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    author: {
      '@type': 'Person',
      description: siteConfig.author.bio,
      name: siteConfig.author.name,
      url: `${siteConfig.url}/about`,
      sameAs: collectSocialLinks(),
    },
    dateModified: metadata.updatedAt || metadata.createdAt,
    datePublished: metadata.createdAt,
    description: resolveArticleDescription(metadata, contentHtml),
    headline: metadata.title,
    image: resolveArticleImageUrl(metadata),
    mainEntityOfPage: {
      '@id': url,
      '@type': 'WebPage',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url,
  };

  /* タグがある場合はkeywordsに追加 */
  if (metadata.tags && metadata.tags.length > EMPTY_LENGTH) {
    jsonLd.keywords = metadata.tags.join(', ');
  }

  return jsonLd;
};

/**
 * サイト全体用のJSON-LDスキーマを生成
 */
export const generateWebSiteJsonLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  description: siteConfig.description,
  name: siteConfig.name,
  url: siteConfig.url,
});

/**
 * ソーシャルリンクのsameAs配列を生成
 */
const collectSocialLinks = (): string[] => {
  const links: string[] = [];
  const socialKeys = ['twitter', 'github', 'zenn', 'qiita'] as const;

  for (const key of socialKeys) {
    const link = siteConfig.links[key];
    if (link) {
      links.push(link);
    }
  }

  return links;
};

/**
 * 組織（Organization）用のJSON-LDスキーマを生成
 */
export const generateOrganizationJsonLd = (): Record<string, unknown> => {
  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
  };

  const sameAs = collectSocialLinks();

  if (sameAs.length > EMPTY_LENGTH) {
    organization.sameAs = sameAs;
  }

  return organization;
};

/**
 * パンくず（BreadcrumbList）用のJSON-LDスキーマを生成
 */
export const generateBreadcrumbJsonLd = (
  items: { name: string; url: string }[]
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    item: item.url,
    name: item.name,
    position: index + 1,
  })),
});
