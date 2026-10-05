import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';
import { getFeaturedExternalArticles } from '@/lib/external/featured-articles';
import { loadOgFont } from '@/lib/og/og-font';
import { OgImageElement } from '@/lib/og/og-image-element';
import { OG_IMAGE_SIZE } from '@/lib/og/og-params';
import { createDevelopmentThumbnailSvg } from '@/lib/og/development-thumbnail-svg';

export const generateStaticParams = async () => {
  const articles = await getFeaturedExternalArticles();
  if (articles.length === 0) return [{ id: 'default', source: 'fallback' }];
  return articles.map(({ article, type }) => ({ id: String(article.id), source: type }));
};

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string; source: string }> }
) => {
  const { id, source } = await params;
  const articles = await getFeaturedExternalArticles();
  const item = articles.find(({ article, type }) => type === source && String(article.id) === id);
  const title = item?.article.title ?? siteConfig.name;
  const date = item
    ? item.type === 'zenn'
      ? item.article.published_at
      : item.article.created_at
    : undefined;
  const subtitle = item ? (item.type === 'zenn' ? 'Zenn' : 'Qiita') : siteConfig.name;

  if (process.env.NODE_ENV === 'development') {
    return new Response(createDevelopmentThumbnailSvg({ date, subtitle, title }), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'image/svg+xml; charset=utf-8',
      },
    });
  }

  const fontData = await loadOgFont();

  return new ImageResponse(<OgImageElement date={date} subtitle={subtitle} title={title} />, {
    ...OG_IMAGE_SIZE,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    fonts: [
      {
        data: fontData,
        name: 'Noto Sans JP',
        style: 'normal',
        weight: 700,
      },
    ],
  });
};
