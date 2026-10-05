import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
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
import { guardLocalWriterRequest } from '@/lib/local-writer-security';

const FILE_NAME = 'eyecatch-generated.png';

export async function POST(request: Request) {
  const denied = guardLocalWriterRequest(request, { mutation: true });
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
    return NextResponse.json({ error: 'タイトルとスラッグが必要です' }, { status: 400 });
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
  const buffer = Buffer.from(await response.arrayBuffer());
  const imageDir = path.join(slugToArticleDir(slug.data), 'images');
  const publicImageDir = path.join(process.cwd(), 'public', 'blog-assets', slug.data, 'images');
  await Promise.all([
    mkdir(imageDir, { recursive: true }),
    mkdir(publicImageDir, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(imageDir, FILE_NAME), buffer),
    writeFile(path.join(publicImageDir, FILE_NAME), buffer),
  ]);

  const url = `images/${FILE_NAME}`;
  return NextResponse.json({
    eyecatch: { height: OG_IMAGE_SIZE.height, url, width: OG_IMAGE_SIZE.width },
    previewUrl: `/blog-assets/${slug.data}/${url}?v=${Date.now()}`,
  });
}
