'use cache';

import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { cacheLife } from 'next/cache';
import { siteConfig } from '@/config/site';
import { readArticleFile } from '@/lib/blog-content/read-article';
import { toBaseContentMetadata } from '@/lib/blog-content/types';
import type { LinkCardMetadata, LinkCardTarget } from '@/lib/link-card';
import type { WriterSourceSnapshot } from '@/lib/writer-source-audit';

const META_PATTERN_FLAGS = 'i';
const MAX_REDIRECTS = 3;

const isPrivateIp = (address: string) => {
  if (address === '::1' || address === '0:0:0:0:0:0:0:1') return true;
  const normalized = address.toLowerCase();
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:'))
    return true;
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const assertSafeExternalUrl = async (value: string) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
  if (url.username || url.password) throw new Error('Credentials are not allowed');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost'))
    throw new Error('Localhost is not allowed');
  if (isIP(url.hostname) && isPrivateIp(url.hostname)) throw new Error('Private IP is not allowed');
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some(({ address }) => isPrivateIp(address)))
    throw new Error('Private IP is not allowed');
  return url;
};

const fetchExternalPage = async (initialUrl: string) => {
  let currentUrl = initialUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertSafeExternalUrl(currentUrl);
    const response = await fetch(currentUrl, {
      cache: 'no-store',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'Mozilla/5.0 (compatible; p1ass-link-preview/1.0)',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.status || response.status < 300 || response.status >= 400)
      return { finalUrl: currentUrl, response };
    const location = response.headers.get('location');
    if (!location) return { finalUrl: currentUrl, response };
    currentUrl = new URL(location, currentUrl).toString();
  }
  throw new Error('Too many redirects');
};

const extractMetaContent = (html: string, property: string): string | undefined => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${escapedProperty}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      META_PATTERN_FLAGS
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapedProperty}["'][^>]*>`,
      META_PATTERN_FLAGS
    ),
  ];
  for (const pattern of patterns) {
    const value = html.match(pattern)?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
};

const extractTitle = (html: string) =>
  extractMetaContent(html, 'og:title') ??
  extractMetaContent(html, 'twitter:title') ??
  html.match(/<title[^>]*>([^<]*)<\/title>/iu)?.[1]?.trim();

const extractAuthor = (html: string) =>
  extractMetaContent(html, 'author') ??
  extractMetaContent(html, 'article:author') ??
  html.match(/"author"\s*:\s*(?:\{[^}]*"name"\s*:\s*)?["']([^"']+)/iu)?.[1]?.trim();

const extractPublishedAt = (html: string) =>
  extractMetaContent(html, 'article:published_time') ??
  extractMetaContent(html, 'datePublished') ??
  extractMetaContent(html, 'date') ??
  html.match(/"datePublished"\s*:\s*["']([^"']+)/iu)?.[1]?.trim() ??
  html.match(/<time[^>]*datetime=["']([^"']+)/iu)?.[1]?.trim();

const extractPageText = (html: string) =>
  html
    .replace(/<(?:script|style|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|svg)>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 100_000);

const readLimitedText = async (response: Response, maxBytes = 500_000) => {
  if (!response.body) return (await response.text()).slice(0, maxBytes);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let size = 0;
  while (size < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    result += decoder.decode(value, { stream: true });
    if (size >= maxBytes) {
      await reader.cancel();
      break;
    }
  }
  return `${result}${decoder.decode()}`.slice(0, maxBytes);
};

const resolveUrl = (value: string | undefined, baseUrl: string) => {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
};

const extractAttribute = (tag: string, attribute: string): string | undefined => {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return tag
    .match(new RegExp(`\\b${escapedAttribute}=["']([^"']+)["']`, META_PATTERN_FLAGS))?.[1]
    ?.trim();
};

const extractWideContentImage = (html: string, baseUrl: string): string | undefined => {
  const imageTags = html.match(/<img\b[^>]*>/giu) ?? [];
  for (const tag of imageTags) {
    const width = Number(extractAttribute(tag, 'width'));
    const height = Number(extractAttribute(tag, 'height'));
    const ratio = width / height;
    if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
    if (width < 600 || height < 300 || ratio < 1.5 || ratio > 2.2) continue;
    const source = extractAttribute(tag, 'src');
    const resolvedSource = resolveUrl(source, baseUrl);
    if (resolvedSource) return resolvedSource;
  }
  return undefined;
};

const extractPreviewImage = (html: string, baseUrl: string): string | undefined => {
  const socialImage = resolveUrl(
    extractMetaContent(html, 'og:image') ?? extractMetaContent(html, 'twitter:image'),
    baseUrl
  );
  const width = Number(extractMetaContent(html, 'og:image:width'));
  const height = Number(extractMetaContent(html, 'og:image:height'));
  const ratio = width / height;
  const isSquareSocialImage = width > 0 && height > 0 && ratio >= 0.85 && ratio <= 1.15;

  return isSquareSocialImage
    ? (extractWideContentImage(html, baseUrl) ?? socialImage)
    : socialImage;
};

const getInternalMetadata = async (target: LinkCardTarget): Promise<LinkCardMetadata | null> => {
  const slug = new URL(target.href, siteConfig.url).pathname.match(/^\/blog\/([^/]+)\/?$/u)?.[1];
  if (!slug) return null;
  try {
    const article = await readArticleFile(slug);
    const metadata = toBaseContentMetadata(slug, article.frontmatter);
    return {
      description: metadata.description,
      image: metadata.eyecatch?.url,
      siteName: new URL(siteConfig.url).hostname,
      title: metadata.title,
    };
  } catch {
    return null;
  }
};

const getExternalMetadata = async (target: LinkCardTarget): Promise<LinkCardMetadata | null> => {
  try {
    const { finalUrl, response } = await fetchExternalPage(target.href);
    const contentType = response.headers?.get?.('content-type');
    if (!response.ok || (contentType && !contentType.includes('text/html'))) return null;
    const html = await readLimitedText(response);
    const title = extractTitle(html);
    if (!title) return null;
    const url = new URL(target.href);
    return {
      description:
        extractMetaContent(html, 'og:description') ??
        extractMetaContent(html, 'description') ??
        extractMetaContent(html, 'twitter:description'),
      image: extractPreviewImage(html, finalUrl),
      siteName: extractMetaContent(html, 'og:site_name') ?? url.hostname,
      title,
    };
  } catch {
    return null;
  }
};

export const inspectExternalWriterSource = async (
  url: string
): Promise<WriterSourceSnapshot | null> => {
  try {
    const { finalUrl, response } = await fetchExternalPage(url);
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/html')) {
      return { finalUrl, statusCode: response.status };
    }
    const html = await readLimitedText(response);
    return {
      author: extractAuthor(html),
      description:
        extractMetaContent(html, 'og:description') ?? extractMetaContent(html, 'description'),
      finalUrl,
      publishedAt: extractPublishedAt(html),
      statusCode: response.status,
      text: extractPageText(html),
      title: extractTitle(html),
    };
  } catch {
    return null;
  }
};

export const getLinkCardMetadata = async (
  target: LinkCardTarget
): Promise<LinkCardMetadata | null> => {
  cacheLife({ expire: 604_800, revalidate: 86_400, stale: 86_400 });
  return target.kind === 'internal' ? getInternalMetadata(target) : getExternalMetadata(target);
};
