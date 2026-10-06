import { unstable_cache } from 'next/cache';
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from '@/lib/cache-policy';
import type { BaseContentMetadata } from '@/lib/content';
import { toBaseContentMetadata } from './types';
import type { BlogArticleData } from './types';
import { listArticleSlugs, isNodeError } from './fs-scan';
import { readArticleFile } from './read-article';
import { countMarkdownCharacters, extractPlainText } from './extract-text';

const sortByDateDescending = (a: BaseContentMetadata, b: BaseContentMetadata): number => {
  const dateA = new Date(a.createdAt).getTime();
  const dateB = new Date(b.createdAt).getTime();
  return dateB - dateA;
};

const isPublicAt = (createdAt: string, now = new Date()) =>
  new Date(createdAt).getTime() <= now.getTime();

const loadAllPostsMetadata = async (): Promise<BaseContentMetadata[]> => {
  const slugs = await listArticleSlugs();

  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const { frontmatter, content } = await readArticleFile(slug);
      if (frontmatter.draft || !isPublicAt(frontmatter.createdAt)) {
        return null;
      }
      const plainText = extractPlainText(content);
      return {
        ...toBaseContentMetadata(slug, frontmatter, plainText.length),
        searchText: plainText,
      };
    })
  );

  return posts.filter((post) => post !== null).sort(sortByDateDescending);
};

export const getAllPostsMetadata = unstable_cache(loadAllPostsMetadata, ['all-posts-metadata'], {
  revalidate: CACHE_REVALIDATE_SECONDS.content,
  tags: [CACHE_TAGS.posts],
});

const loadPostBySlug = async (slug: string | string[]): Promise<BlogArticleData> => {
  const slugPath = Array.isArray(slug) ? slug.join('/') : slug;

  try {
    const { frontmatter, content } = await readArticleFile(slugPath);
    if (frontmatter.draft || !isPublicAt(frontmatter.createdAt)) {
      throw new Error(`Post not found: ${slugPath}`);
    }
    return {
      contentMarkdown: content,
      metadata: toBaseContentMetadata(slugPath, frontmatter, countMarkdownCharacters(content)),
    };
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new Error(`Post not found: ${slugPath}`, { cause: error });
    }
    throw error;
  }
};

export const getPostBySlug = unstable_cache(loadPostBySlug, ['post-by-slug'], {
  revalidate: CACHE_REVALIDATE_SECONDS.content,
  tags: [CACHE_TAGS.posts],
});
