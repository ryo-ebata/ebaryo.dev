import { ImageResponse } from 'next/og';
import { getAllExternalArticles } from '@/lib/external/featured-articles';
import type { ExternalArticleSource } from '@/lib/external-thumbnail';
import { loadOgFont } from '@/lib/og/og-font';
import { OG_IMAGE_SIZE } from '@/lib/og/og-params';
import {
  createExternalArticleThumbnailSvg,
  ExternalArticleThumbnail,
} from '@/lib/og/external-article-thumbnail';
import { loadExternalLogoDataUrl } from '@/lib/og/external-logo';

export const generateStaticParams = async () => {
  const articles = await getAllExternalArticles();
  if (articles.length === 0) return [{ id: 'default', source: 'fallback' }];
  return articles.map(({ article, type }) => ({ id: String(article.id), source: type }));
};

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string; source: string }> }
) => {
  const { id, source } = await params;
  const articles = await getAllExternalArticles();
  const item = articles.find(({ article, type }) => type === source && String(article.id) === id);
  if (!item) {
    return new Response('External article not found', { status: 404 });
  }
  const articleSource: ExternalArticleSource = item.type;
  const title = item.article.title;
  const date = item.type === 'zenn' ? item.article.published_at : item.article.created_at;
  const logoSrc = await loadExternalLogoDataUrl(articleSource);

  if (process.env.NODE_ENV === 'development') {
    return new Response(
      createExternalArticleThumbnailSvg({ date, logoSrc, source: articleSource, title }),
      {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'image/svg+xml; charset=utf-8',
        },
      }
    );
  }

  const fontData = await loadOgFont();

  return new ImageResponse(
    <ExternalArticleThumbnail date={date} logoSrc={logoSrc} source={articleSource} title={title} />,
    {
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
    }
  );
};
