import { getFeaturedExternalArticles } from '@/lib/external/featured-articles';
import { HomePresenter } from './presenter';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';
import { cacheLife, cacheTag } from 'next/cache';

const MAX_HOME_POSTS = 4;

export const HomeContainer = async () => {
  'use cache';
  cacheLife('hours');
  cacheTag('home');
  cacheTag('posts');
  cacheTag('zenn-articles');
  cacheTag('qiita-articles');

  const [posts, allArticles] = await Promise.all([
    getAllPostsMetadata(),
    getFeaturedExternalArticles(),
  ]);

  return <HomePresenter articles={allArticles} posts={posts.slice(0, MAX_HOME_POSTS)} />;
};
