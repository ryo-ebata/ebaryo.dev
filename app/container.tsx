import { type QiitaArticle, getQiitaArticles } from '@/lib/external/qiita';
import { type ZennArticle, getZennArticles } from '@/lib/external/zenn';
import { HomePresenter } from './presenter';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';

type ArticleItem =
  | { article: ZennArticle; type: 'zenn' }
  | { article: QiitaArticle; type: 'qiita' };

type ArticleWithLikes =
  | { article: ZennArticle; likesCount: number; type: 'zenn' }
  | { article: QiitaArticle; likesCount: number; type: 'qiita' };

const SLICE_START_INDEX = 0;
const MAX_EXTERNAL_ARTICLES = 5;
const MAX_HOME_POSTS = 6;

export const HomeContainer = async () => {
  const [posts, zennArticlesResponse, qiitaArticles] = await Promise.all([
    getAllPostsMetadata(),
    getZennArticles(),
    getQiitaArticles(),
  ]);

  const zennArticles = zennArticlesResponse.articles;

  /* Zenn記事とQiita記事をマージしていいね数でソート（最大5件） */
  const articlesWithLikes: ArticleWithLikes[] = [
    ...zennArticles.map((article) => ({
      article,
      likesCount: article.liked_count,
      type: 'zenn' as const,
    })),
    ...qiitaArticles.map((article) => ({
      article,
      likesCount: article.likes_count,
      type: 'qiita' as const,
    })),
  ];

  const allArticles: ArticleItem[] = articlesWithLikes
    .sort((itemA, itemB) => itemB.likesCount - itemA.likesCount)
    .slice(SLICE_START_INDEX, MAX_EXTERNAL_ARTICLES)
    .map(({ article, type }): ArticleItem => {
      if (type === 'zenn') {
        return { article, type: 'zenn' };
      }
      return { article, type: 'qiita' };
    });

  return <HomePresenter articles={allArticles} posts={posts.slice(0, MAX_HOME_POSTS)} />;
};
