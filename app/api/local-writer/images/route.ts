import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { imageSize } from 'image-size';
import { NextResponse } from 'next/server';
import { localArticleSchema } from '@/lib/local-writer';
import { slugToArticleDir } from '@/lib/blog-content/paths';
import { guardLocalWriterRequest } from '@/lib/local-writer-security';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  const denied = guardLocalWriterRequest(request, { mutation: true });
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get('image');
  const purpose = formData.get('purpose') === 'eyecatch' ? 'eyecatch' : 'body';
  const slug = localArticleSchema.shape.slug.safeParse(formData.get('slug'));
  if (!(file instanceof File) || !slug.success) {
    return NextResponse.json({ error: '画像とスラッグが必要です' }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: '4MB以下のPNG・JPEG・GIF・WebPを選んでください' },
      { status: 400 }
    );
  }

  const baseName =
    path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9_-]+/g, '-') || 'image';
  const fileName = `${purpose === 'eyecatch' ? 'eyecatch' : baseName}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let dimensions: ReturnType<typeof imageSize>;
  try {
    dimensions = imageSize(buffer);
  } catch {
    return NextResponse.json({ error: '画像ファイルを読み取れませんでした' }, { status: 400 });
  }
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
    eyecatch: { height: dimensions.height, url, width: dimensions.width },
    markdown: `![${baseName}](${url})`,
    previewUrl: `/blog-assets/${slug.data}/${url}`,
  });
}
