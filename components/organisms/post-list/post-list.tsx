'use client';

import { Fragment } from 'react';
import { ArticleCard } from '@/components/organisms/article-card/article-card';
import { EmptyState } from '@/components/molecules/empty-state/empty-state';
import { PromoCard } from '@/components/organisms/promo-card/promo-card';
import type { ArticleListItem } from '@/lib/content';
import { cn } from '@/lib/utils';
import { trackProductEvent } from '@/lib/analytics';

/** 何件ごとに広告カードを挟むか */
const AD_INTERVAL = 6;

interface PostListProps {
  basePath?: string;
  posts: ArticleListItem[];
  /** 一覧の先頭カード(LCP候補)にpriorityを付けるか。関連記事など画面外に出る一覧では付けない */
  prioritizeFirst?: boolean;
  trackingPlacement?: string;
}

export function PostList({
  basePath = '/blog',
  posts,
  prioritizeFirst = false,
  trackingPlacement,
}: PostListProps) {
  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6')}>
      {posts.map((post, index) => {
        const href = post.href ?? `${basePath}/${post.slug}`;
        const showAd = (index + 1) % AD_INTERVAL === 0 && index + 1 < posts.length;
        return (
          <Fragment key={post.slug}>
            <ArticleCard
              title={post.title}
              href={href}
              slug={post.isExternal ? undefined : post.slug}
              date={post.createdAt}
              updatedAt={post.updatedAt}
              tags={post.tags}
              description={post.description}
              eyecatch={post.eyecatch}
              isExternal={post.isExternal}
              priority={prioritizeFirst && index === 0}
              onNavigate={
                trackingPlacement
                  ? () =>
                      trackProductEvent('content_link_click', {
                        destination_path: href,
                        placement: trackingPlacement,
                      })
                  : undefined
              }
            />
            {showAd && <PromoCard seed={Math.floor(index / AD_INTERVAL)} />}
          </Fragment>
        );
      })}
    </div>
  );
}
