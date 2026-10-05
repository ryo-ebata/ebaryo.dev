import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { extractPlainText } from './blog-content/extract-text';
import type { BaseContentMetadata } from './content';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const META_DESCRIPTION_LENGTH = 120;

interface BaseMetadataParams {
  description: string;
  image?: string;
  imageAlt?: string;
  /** trueの場合、検索エンジンにnoindex,followを指示する(絞り込み結果など重複コンテンツ向け) */
  noindex?: boolean;
  title: string;
  type?: 'article' | 'website';
  url?: string;
}

interface ArticleMetadataParams extends BaseMetadataParams {
  modifiedTime?: string;
  publishedTime?: string;
  tags?: string[];
  type: 'article';
}

type MetadataParams = ArticleMetadataParams | BaseMetadataParams;

const isArticleMetadata = (params: MetadataParams): params is ArticleMetadataParams =>
  params.type === 'article';

/**
 * 相対パスを絶対URLに変換する。すでに絶対URLならそのまま返す。
 */
export const toAbsoluteUrl = (path: string): string =>
  path.startsWith('http') ? path : `${siteConfig.url}${path}`;

/**
 * OGP画像のURLを生成
 * image未指定時はundefinedを返し、opengraph-image.tsxにフォールバックさせる
 */
const getOgImageUrl = (image?: string): string | undefined =>
  image ? toAbsoluteUrl(image) : undefined;

/**
 * 記事のOGP/構造化データ用画像URLを解決する。
 * 本文用画像の縦横比や容量に依存させず、1200×630の専用画像を動的生成する。
 */
export const resolveArticleImageUrl = (metadata: Pick<BaseContentMetadata, 'title'>): string =>
  toAbsoluteUrl(`/og?title=${encodeURIComponent(metadata.title)}`);

/**
 * 記事のOGP/構造化データ用descriptionを解決する。
 * 未入力ならcontentHtmlの本文冒頭から抽出し、それも無ければサイト全体の説明文にフォールバックする。
 * (未入力記事が全てサイト説明文になり検索結果で重複スニペットになるのを防ぐ)
 */
export const resolveArticleDescription = (
  metadata: Pick<BaseContentMetadata, 'description'>,
  contentHtml?: string
): string => {
  if (metadata.description) {
    return metadata.description;
  }
  const plainText = contentHtml ? extractPlainText(contentHtml) : '';
  if (plainText) {
    return plainText.slice(0, META_DESCRIPTION_LENGTH);
  }
  return siteConfig.description;
};

/**
 * OGタイトルを生成
 */
const getOgTitle = (title: string, type: 'article' | 'website'): string => {
  if (type === 'article') {
    return title;
  }
  return `${title} | ${siteConfig.name}`;
};

/**
 * 共通のメタデータを生成
 */
export const generateMetadata = (params: MetadataParams): Metadata => {
  const { description, image, imageAlt, noindex, title, type = 'website', url } = params;

  const ogImageUrl = getOgImageUrl(image);
  const pageUrl = url || siteConfig.url;
  const ogTitle = getOgTitle(title, type);
  const imageAltText = imageAlt || title;

  const baseMetadata: Metadata = {
    alternates: {
      canonical: pageUrl,
      types: {
        'application/rss+xml': `${siteConfig.url}/rss.xml`,
        'application/feed+json': `${siteConfig.url}/feed.json`,
      },
    },
    description,
    ...(noindex && { robots: { follow: true, index: false } }),
    openGraph: {
      description,
      ...(ogImageUrl && {
        images: [
          { alt: imageAltText, height: OG_IMAGE_HEIGHT, url: ogImageUrl, width: OG_IMAGE_WIDTH },
        ],
      }),
      locale: 'ja_JP',
      siteName: siteConfig.name,
      title: ogTitle,
      type,
      url: pageUrl,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
      title: ogTitle,
    },
  };

  /* 記事タイプの場合は追加のメタデータを設定 */
  if (isArticleMetadata(params)) {
    const openGraph: NonNullable<Metadata['openGraph']> = {
      ...baseMetadata.openGraph,
      modifiedTime: params.modifiedTime,
      publishedTime: params.publishedTime,
      tags: params.tags,
      type: 'article',
    };
    baseMetadata.openGraph = openGraph;
  }

  return baseMetadata;
};
