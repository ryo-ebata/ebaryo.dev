import type { BaseContentMetadata } from '@/lib/content';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';
import { siteConfig } from '@/config/site';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAD_LENGTH = 2;
const PAD_CHAR = '0';

/**
 * 日付をRFC 822形式に変換
 */
const formatRFC822 = (date: Date): string => {
  const day = DAYS[date.getUTCDay()];
  const dayNum = String(date.getUTCDate()).padStart(PAD_LENGTH, PAD_CHAR);
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(PAD_LENGTH, PAD_CHAR);
  const minutes = String(date.getUTCMinutes()).padStart(PAD_LENGTH, PAD_CHAR);
  const seconds = String(date.getUTCSeconds()).padStart(PAD_LENGTH, PAD_CHAR);

  return `${day}, ${dayNum} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
};

/**
 * XMLエスケープ
 */
const escapeXml = (unsafe: string): string =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildRssFeed = async (): Promise<string> => {
  const posts = await getAllPostsMetadata();
  const siteUrl = siteConfig.url;

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
 <title>${escapeXml(siteConfig.name)}</title>
 <description>${escapeXml(siteConfig.description)}</description>
 <link>${siteUrl}</link>
 <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
 <language>ja</language>
 <lastBuildDate>${formatRFC822(new Date())}</lastBuildDate>
 ${posts
   .map((post: BaseContentMetadata) => {
     const postUrl = `${siteUrl}/blog/${post.slug}`;
     const pubDate = formatRFC822(new Date(post.createdAt));
     let description = '';
     if (post.description) {
       description = escapeXml(post.description);
     }

     return `<item>
  <title>${escapeXml(post.title)}</title>
  <description>${description}</description>
  <link>${postUrl}</link>
  <guid isPermaLink="true">${postUrl}</guid>
  <pubDate>${pubDate}</pubDate>
</item>`;
   })
   .join('\n ')}
</channel>
</rss>`;
};

export const GET = async () => {
  const rssFeed = await buildRssFeed();

  return new Response(rssFeed, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  });
};
