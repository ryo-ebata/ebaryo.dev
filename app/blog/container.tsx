import { logger } from '@/lib/logger';
import { paginateItems } from '@/lib/pagination';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';
import { filterPostsByQuery } from '@/lib/search';
import { aggregateTags, filterPostsByTags } from '@/lib/tags';
import { BlogListPresenter } from './presenter';

interface BlogListContainerProps {
  currentPage: number;
  searchQuery: string;
  selectedTags: string[];
}

const POSTS_PER_PAGE = 10;

export const BlogListContainer = async ({
  currentPage,
  searchQuery,
  selectedTags,
}: BlogListContainerProps) => {
  try {
    const allPostsMetadata = await getAllPostsMetadata();

    const tagCounts = aggregateTags(allPostsMetadata);
    const filteredByTags = filterPostsByTags(allPostsMetadata, selectedTags);
    const filteredPosts = filterPostsByQuery(filteredByTags, searchQuery);
    const { items: posts, totalPages } = paginateItems(filteredPosts, currentPage, POSTS_PER_PAGE);

    return (
      <BlogListPresenter
        currentPage={currentPage}
        posts={posts}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        tagCounts={tagCounts}
        totalCount={filteredPosts.length}
        totalPages={totalPages}
      />
    );
  } catch (error) {
    logger.error('ブログ記事一覧の取得に失敗しました', { source: 'blog-list' }, error);
    return (
      <BlogListPresenter
        currentPage={currentPage}
        posts={[]}
        searchQuery=""
        selectedTags={[]}
        tagCounts={[]}
        totalCount={0}
        totalPages={0}
      />
    );
  }
};
