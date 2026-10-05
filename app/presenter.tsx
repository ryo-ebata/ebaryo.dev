'use client';

import { ArticleCard } from '@/components/organisms/article-card/article-card';
import { Container } from '@/components/organisms/container';
import { BackLink } from '@/components/atoms';
import { ArrowRight, Boxes, Github, Mic2 } from 'lucide-react';

import type { BaseContentMetadata } from '@/lib/content';
import type { QiitaArticle } from '@/lib/external/qiita';
import { createExternalThumbnailPath, type ExternalArticleItem } from '@/lib/external-thumbnail';
import { Link } from 'next-view-transitions';

interface HomePresenterProps {
  articles: ExternalArticleItem[];
  posts: BaseContentMetadata[];
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="section-heading text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

function getQiitaTags(tags: QiitaArticle['tags']): string[] {
  if (tags.length > 0) {
    return [tags[0].name];
  }
  return [];
}

function renderArticle(item: ExternalArticleItem, index: number, shouldPrioritizeFirst: boolean) {
  if (item.type === 'zenn') {
    return (
      <ArticleCard
        key={`zenn-${item.article.id}`}
        date={item.article.published_at}
        eyecatch={{
          url: createExternalThumbnailPath('zenn', item.article.id),
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
        url: createExternalThumbnailPath('qiita', item.article.id),
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
  articles: ExternalArticleItem[];
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
    <div className="page-heading mb-12 sm:mb-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary">Writing / Field notes</p>
      <h1 className="max-w-3xl scroll-m-20 text-4xl font-bold leading-tight tracking-[-0.035em] text-foreground sm:text-6xl">
        技術と仕事の判断を、実践から書く
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
        生成AI、Web開発、個人の知識管理を中心に、試して分かったことと考えたことを共有する。
      </p>
    </div>
  );
}

function PortfolioGateway() {
  return (
    <section className="geometric-panel group p-6 sm:p-8" aria-labelledby="portfolio-gateway-title">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-64 sm:block"
        aria-hidden="true"
      >
        <div className="absolute right-12 top-7 size-24 rotate-45 border border-primary/25 transition-transform duration-500 group-hover:rotate-[60deg]" />
        <div className="absolute right-24 top-14 size-16 bg-primary/10" />
        <div className="absolute bottom-7 right-7 grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="size-1.5 rounded-full bg-foreground/20" />
          ))}
        </div>
      </div>
      <div className="relative max-w-xl space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Boxes className="size-4" aria-hidden="true" />
          Portfolio
        </div>
        <div className="space-y-2">
          <h2
            id="portfolio-gateway-title"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            作ったものと、OSSへの貢献
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            自作OSS、個人開発、GitHubでのコントリビュート、Podcast、登壇資料をまとめている。
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Github className="size-3.5" aria-hidden="true" />
            OSS Contribution
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mic2 className="size-3.5" aria-hidden="true" />
            Podcast & Talk
          </span>
        </div>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
        >
          Portfolioを見る
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
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

        <PortfolioGateway />

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
