import { getFeaturedExternalArticles } from '@/lib/external/featured-articles';
import { HomePresenter } from './presenter';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';

const MAX_HOME_POSTS = 4;

export const HomeContainer = async () => {
  const [posts, allArticles] = await Promise.all([
    getAllPostsMetadata(),
    getFeaturedExternalArticles(),
  ]);

  return <HomePresenter articles={allArticles} posts={posts.slice(0, MAX_HOME_POSTS)} />;
};
