import type { BaseContentMetadata } from '@/lib/content';
import type { MetadataRoute } from 'next';
import { cacheLife } from 'next/cache';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';
import { aggregateTags } from '@/lib/tags';
import { toAbsoluteUrl } from '@/lib/metadata';
import { siteConfig } from '@/config/site';

/* 優先度定数 */
const PRIORITY_HIGHEST = 1;
const PRIORITY_HIGH = 0.8;
const PRIORITY_MEDIUM = 0.7;

export const createStaticPages = (): MetadataRoute.Sitemap => {
  return [
    {
      changeFrequency: 'monthly',
      priority: PRIORITY_HIGHEST,
      url: siteConfig.url,
    },
    {
      changeFrequency: 'monthly',
      priority: PRIORITY_HIGH,
      url: `${siteConfig.url}/about`,
    },
    {
      changeFrequency: 'daily',
      priority: PRIORITY_HIGH,
      url: `${siteConfig.url}/blog`,
    },
    {
      changeFrequency: 'monthly',
      priority: PRIORITY_HIGH,
      url: `${siteConfig.url}/portfolio`,
    },
    {
      changeFrequency: 'monthly',
      priority: PRIORITY_MEDIUM,
      url: `${siteConfig.url}/sitemap-page`,
    },
  ];
};

const createBlogPostEntries = (posts: BaseContentMetadata[]): MetadataRoute.Sitemap =>
  posts.map((post) => ({
    changeFrequency: 'weekly',
    ...(post.eyecatch && { images: [toAbsoluteUrl(post.eyecatch.url)] }),
    lastModified: new Date(post.updatedAt || post.createdAt),
    priority: PRIORITY_MEDIUM,
    url: `${siteConfig.url}/blog/${post.slug}`,
  }));

export const createTagEntries = (posts: BaseContentMetadata[]): MetadataRoute.Sitemap =>
  aggregateTags(posts)
    .filter(({ count }) => count > 1)
    .map(({ tag }) => {
      const tagPosts = posts.filter((post) => post.tags?.includes(tag));
      return {
        changeFrequency: 'weekly',
        lastModified: getLatestPostDate(tagPosts),
        priority: PRIORITY_MEDIUM,
        url: `${siteConfig.url}/blog/tag/${encodeURIComponent(tag)}`,
      };
    });

const getLatestPostDate = (posts: BaseContentMetadata[]): Date | undefined => {
  const timestamps = posts
    .map((post) => new Date(post.updatedAt || post.createdAt).getTime())
    .filter(Number.isFinite);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  'use cache';
  cacheLife('hours');

  const posts = await getAllPostsMetadata();
  const staticPages = createStaticPages();
  const blogPosts = createBlogPostEntries(posts);
  const tagPages = createTagEntries(posts);

  return [...staticPages, ...blogPosts, ...tagPages];
};

export default sitemap;
