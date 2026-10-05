import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import { createDevelopmentThumbnailSvg } from '@/lib/og/development-thumbnail-svg';
import { OgImageElement } from '@/lib/og/og-image-element';
import {
  normalizeOgText,
  normalizeThumbnailLayout,
  normalizeThumbnailMotif,
  normalizeThumbnailVariant,
  OG_IMAGE_SIZE,
} from '@/lib/og/og-params';
import { loadOgFont } from '@/lib/og/og-font';
import { localArticleSchema } from '@/lib/local-writer';
import { slugToArticleDir } from '@/lib/blog-content/paths';

const PNG_FILE_NAME = 'eyecatch-generated.png';
const SVG_FILE_NAME = 'eyecatch-generated.svg';

interface RenderedThumbnail {
  buffer: Buffer;
  fileName: string;
}

const renderThumbnail = async ({
  date,
  layout,
  motif,
  subtitle,
  title,
  variant,
}: {
  date?: string;
  layout: ReturnType<typeof normalizeThumbnailLayout>;
  motif: ReturnType<typeof normalizeThumbnailMotif>;
  subtitle: string;
  title: string;
  variant: ReturnType<typeof normalizeThumbnailVariant>;
}): Promise<RenderedThumbnail> => {
  if (process.env.NODE_ENV === 'development') {
    const svg = createDevelopmentThumbnailSvg({ date, layout, subtitle, title, variant });
    return { buffer: Buffer.from(svg, 'utf8'), fileName: SVG_FILE_NAME };
  }

  const fontData = await loadOgFont();
  const response = new ImageResponse(
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
  return { buffer: Buffer.from(await response.arrayBuffer()), fileName: PNG_FILE_NAME };
};

export async function POST(request: Request) {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  const payload = (await request.json()) as Record<string, unknown>;
  const slug = localArticleSchema.shape.slug.safeParse(payload.slug);
  const title = normalizeOgText(String(payload.title ?? ''), '', 120);
  const subtitle = normalizeOgText(String(payload.subtitle ?? ''), 'ebaryo.dev', 80);
  const variant = normalizeThumbnailVariant(String(payload.variant ?? ''));
  const layout = normalizeThumbnailLayout(String(payload.layout ?? ''));
  const motif = normalizeThumbnailMotif(String(payload.motif ?? ''));
  const date = /^\d{4}-\d{2}-\d{2}$/u.test(String(payload.date ?? ''))
    ? String(payload.date)
    : undefined;
  if (!slug.success || !title) {
    return localApiError('タイトルとスラッグが必要です', 400);
  }

  try {
    const { buffer, fileName } = await renderThumbnail({
      date,
      layout,
      motif,
      subtitle,
      title,
      variant,
    });
    const imageDir = path.join(slugToArticleDir(slug.data), 'images');
    const publicImageDir = path.join(process.cwd(), 'public', 'blog-assets', slug.data, 'images');
    await Promise.all([
      mkdir(imageDir, { recursive: true }),
      mkdir(publicImageDir, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(path.join(imageDir, fileName), buffer),
      writeFile(path.join(publicImageDir, fileName), buffer),
    ]);

    const url = `images/${fileName}`;
    return NextResponse.json({
      eyecatch: { height: OG_IMAGE_SIZE.height, url, width: OG_IMAGE_SIZE.width },
      previewUrl: `/blog-assets/${slug.data}/${url}?v=${Date.now()}`,
    });
  } catch (error) {
    console.error('[local-writer/thumbnail] Failed to generate thumbnail', error);
    return localApiError('サムネイル画像の生成に失敗しました', 500);
  }
}
