import {
  generateMetadata as generatePageMetadata,
  resolveArticleDescription,
  resolveArticleImageUrl,
} from '@/lib/metadata';
import { getAllPostsMetadata, getPostBySlug } from '@/lib/blog-content/blog';
import type { BlogArticleData } from '@/lib/blog-content/types';
import { siteConfig } from '@/config/site';

import type { Metadata } from 'next';

import { BlogPostContainer } from './container';

interface Props {
  params: Promise<{ slug: string[] }>;
}

/* dynamicParams(旧: false固定の完全SSG)はcacheComponentsと非互換のため廃止。
   generateStaticParamsに無いslugはビルド後の新ISR挙動(即座にloading.tsxの
   App Shellを表示し裏で完全prerenderへ昇格)でオンデマンド生成される。
   本当に存在しないslugはBlogPostContainer側でgetPostBySlug失敗時にnotFound()
   を呼ぶため、404という見た目の挙動は変わらない。 */

/*
 * 静的パラメータ生成
 */
export const generateStaticParams = async () => {
  const posts = await getAllPostsMetadata();
  return posts.map((post) => ({
    slug: post.slug.split('/'),
  }));
};

/*
 * メタデータを生成するヘルパー関数
 */
const buildMetadata = (post: BlogArticleData): Metadata => {
  const postUrl = `${siteConfig.url}/blog/${post.metadata.slug}`;
  const description = resolveArticleDescription(post.metadata, post.contentMarkdown);

  const metadataTitle = post.metadata.seoTitle ?? post.metadata.title;
  const ogImage = resolveArticleImageUrl({ title: metadataTitle });

  return generatePageMetadata({
    description,
    image: ogImage,
    imageAlt: metadataTitle,
    modifiedTime: post.metadata.updatedAt,
    publishedTime: post.metadata.createdAt,
    tags: post.metadata.tags,
    noindex: post.metadata.noindex,
    title: metadataTitle,
    type: 'article',
    url: post.metadata.canonicalUrl ?? postUrl,
  });
};

/*
 * メタデータ生成（SEO対策）
 */
export const generateMetadata = async ({ params }: Props) => {
  const { slug: pageSlug } = await params;

  try {
    const post = await getPostBySlug(pageSlug);
    return buildMetadata(post);
  } catch {
    return {};
  }
};

const BlogPostPage = async ({ params }: Props) => {
  const { slug: pageSlug } = await params;

  return <BlogPostContainer slug={pageSlug} />;
};

export default BlogPostPage;
