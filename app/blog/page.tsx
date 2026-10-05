import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateMetadata as generatePageMetadata } from '@/lib/metadata';
import { siteConfig } from '@/config/site';

import { BlogListContainer } from './container';
import { BlogListSkeleton } from './blog-list-skeleton';

interface BlogPageProps {
  searchParams: Promise<{ page?: string; search?: string; tags?: string }>;
}

const DEFAULT_PAGE = 1;
const BASE_RADIX = 10;

/*
 * メタデータ生成(SEO対策)
 * search/tagsによる絞り込みは/blog/tag/[slug]等の正規URLと重複するコンテンツになるため
 * noindexにしてクロールバジェットの浪費を防ぐ。ページネーション(page)単体はindex許可のまま。
 */
export const generateMetadata = async ({ searchParams }: BlogPageProps): Promise<Metadata> => {
  const { page, search, tags } = await searchParams;
  const isFiltered = Boolean(search) || Boolean(tags);
  const currentPage = parsePageNumber(page);
  const canonicalUrl =
    currentPage > DEFAULT_PAGE
      ? `${siteConfig.url}/blog?page=${currentPage}`
      : `${siteConfig.url}/blog`;

  return generatePageMetadata({
    description: `${siteConfig.name}のブログ記事一覧です。技術的な学びや日々の気づきを共有しています。`,
    noindex: isFiltered,
    title: 'ブログ',
    url: canonicalUrl,
  });
};

/* タグ文字列をパースしてタグ配列を返す */
const parseTags = (tags: string | undefined): string[] => {
  if (tags) {
    return tags.split(',').filter(Boolean);
  }
  return [];
};

/* ページ番号文字列をパースして数値を返す */
const parsePageNumber = (page: string | undefined): number => {
  if (!page) {
    return DEFAULT_PAGE;
  }

  const parsedPage = Number.parseInt(page, BASE_RADIX);
  return Number.isInteger(parsedPage) && parsedPage >= DEFAULT_PAGE ? parsedPage : DEFAULT_PAGE;
};

/* 検索クエリを正規化する */
const normalizeSearchQuery = (search: string | undefined): string => {
  if (search) {
    return search;
  }
  return '';
};

const BlogListResolver = async ({ searchParams }: BlogPageProps) => {
  const { page, search, tags } = await searchParams;
  const selectedTags = parseTags(tags);
  const currentPage = parsePageNumber(page);
  const searchQuery = normalizeSearchQuery(search);

  return (
    <BlogListContainer
      currentPage={currentPage}
      searchQuery={searchQuery}
      selectedTags={selectedTags}
    />
  );
};

const BlogListPage = ({ searchParams }: BlogPageProps) => (
  <Suspense fallback={<BlogListSkeleton />}>
    <BlogListResolver searchParams={searchParams} />
  </Suspense>
);

export default BlogListPage;
