import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { siteConfig } from '@/config/site';
import { loadOgFont } from '@/lib/og/og-font';
import { OgImageElement } from '@/lib/og/og-image-element';
import {
  normalizeOgText,
  normalizeThumbnailLayout,
  normalizeThumbnailMotif,
  normalizeThumbnailVariant,
  OG_IMAGE_SIZE,
} from '@/lib/og/og-params';

const MAX_TITLE_LENGTH = 120;
const MAX_SUBTITLE_LENGTH = 80;
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';

/**
 * 記事タイトルを焼き込んだ動的OG画像を生成する共通エンドポイント。
 * catch-all ルート([...slug])配下には opengraph-image を置けない(Next.js 制約)ため、
 * クエリ ?title= で生成し、記事の専用OG画像としてmetadataから参照する。
 */
export const GET = async (request: NextRequest) => {
  const title = normalizeOgText(
    request.nextUrl.searchParams.get('title'),
    siteConfig.name,
    MAX_TITLE_LENGTH
  );
  const subtitle = normalizeOgText(
    request.nextUrl.searchParams.get('subtitle'),
    siteConfig.name,
    MAX_SUBTITLE_LENGTH
  );
  const variant = normalizeThumbnailVariant(request.nextUrl.searchParams.get('variant'));
  const layout = normalizeThumbnailLayout(request.nextUrl.searchParams.get('layout'));
  const motif = normalizeThumbnailMotif(request.nextUrl.searchParams.get('motif'));
  const requestedDate = request.nextUrl.searchParams.get('date');
  const date =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/u.test(requestedDate) ? requestedDate : undefined;
  const fontData = await loadOgFont();

  return new ImageResponse(
    <OgImageElement
      date={date}
      layout={layout}
      motif={motif}
      subtitle={subtitle}
      title={title}
      variant={variant}
    />,
    {
      ...OG_IMAGE_SIZE,
      headers: { 'Cache-Control': CACHE_CONTROL },
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
