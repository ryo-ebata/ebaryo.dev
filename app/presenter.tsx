'use client';

import { ArticleCard } from '@/components/organisms/article-card/article-card';
import { Container } from '@/components/organisms/container';
import { BackLink } from '@/components/atoms';

import type { BaseContentMetadata } from '@/lib/content';
import type { QiitaArticle } from '@/lib/external/qiita';
import type { ZennArticle } from '@/lib/external/zenn';
import { contentThemes } from '@/lib/themes';
import { createOgImagePath } from '@/lib/og/og-params';
import { Link } from 'next-view-transitions';

type ArticleItem =
  | { article: ZennArticle; type: 'zenn' }
  | { article: QiitaArticle; type: 'qiita' };

interface HomePresenterProps {
  articles: ArticleItem[];
  posts: BaseContentMetadata[];
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight text-foreground">{children}</h2>;
}

function getQiitaTags(tags: QiitaArticle['tags']): string[] {
  if (tags.length > 0) {
    return [tags[0].name];
  }
  return [];
}

function renderArticle(item: ArticleItem, index: number, shouldPrioritizeFirst: boolean) {
  if (item.type === 'zenn') {
    return (
      <ArticleCard
        key={`zenn-${item.article.id}`}
        date={item.article.published_at}
        eyecatch={{
          url: createOgImagePath({
            date: item.article.published_at,
            subtitle: 'Zenn',
            title: item.article.title,
          }),
        }}
        href={`https://zenn.dev${item.article.path}`}
        isExternal
        priority={index === 0 && shouldPrioritizeFirst}
        tags={[item.article.post_type]}
        title={item.article.title}
      />
    );
  }

  return (
    <ArticleCard
      key={`qiita-${item.article.id}`}
      date={item.article.created_at}
      eyecatch={{
        url: createOgImagePath({
          date: item.article.created_at,
          subtitle: 'Qiita',
          title: item.article.title,
        }),
      }}
      href={item.article.url}
      isExternal
      priority={index === 0 && shouldPrioritizeFirst}
      tags={getQiitaTags(item.article.tags)}
      title={item.article.title}
    />
  );
}

interface PostsSectionProps {
  posts: BaseContentMetadata[];
}

function PostsSection({ posts }: PostsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading>最新記事</SectionHeading>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {posts.map((post, index) => (
          <ArticleCard
            key={post.slug}
            date={post.createdAt}
            updatedAt={post.updatedAt}
            description={post.description}
            eyecatch={post.eyecatch}
            href={`/blog/${post.slug}`}
            slug={post.slug}
            isExternal={false}
            priority={index === 0}
            tags={post.tags}
            title={post.title}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <BackLink href="/blog" label="すべての記事を見る" />
      </div>
    </div>
  );
}

interface ArticlesSectionProps {
  articles: ArticleItem[];
  shouldPrioritizeFirstArticle: boolean;
}

function ArticlesSection({ articles, shouldPrioritizeFirstArticle }: ArticlesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading>外部記事</SectionHeading>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {articles.map((item, index) => renderArticle(item, index, shouldPrioritizeFirstArticle))}
      </div>
      <div className="flex justify-end">
        <BackLink href="/about" label="その他ソーシャル記事を見る" />
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-12 text-center space-y-3">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-foreground">
        技術と仕事の判断を、実践から書く
      </h1>
      <p className="mx-auto max-w-2xl text-base text-muted-foreground">
        生成AI、Web開発、個人の知識管理を中心に、試して分かったことと考えたことを共有する。
      </p>
    </div>
  );
}

function ThemesSection() {
  return (
    <section aria-label="テーマから読む" className="space-y-5">
      <div className="space-y-1">
        <SectionHeading>テーマから読む</SectionHeading>
        <p className="text-sm text-muted-foreground">関心のある領域から記事をまとめて探せる。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {contentThemes.map((theme) => (
          <Link
            key={theme.slug}
            href={`/blog/theme/${theme.slug}`}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25 hover:bg-muted/40"
          >
            <h3 className="font-semibold text-card-foreground group-hover:text-primary">
              {theme.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{theme.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomePresenter({ articles, posts }: HomePresenterProps) {
  const hasPosts = posts.length > 0;
  const hasArticles = articles.length > 0;
  const shouldPrioritizeFirstArticle = !hasPosts && hasArticles;

  return (
    <Container maxWidth="4xl">
      <div className="space-y-12">
        <PageHeader />

        <ThemesSection />

        {hasPosts && <PostsSection posts={posts} />}

        {hasArticles && (
          <ArticlesSection
            articles={articles}
            shouldPrioritizeFirstArticle={shouldPrioritizeFirstArticle}
          />
        )}
      </div>
    </Container>
  );
}
