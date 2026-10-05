import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import { localArticleSchema, serializeLocalArticle } from '@/lib/local-writer';
import { normalizeWriterMarkdown } from '@/lib/writer-markdown';
import { analyzeWriterLibrary } from '@/lib/writer-library';
import { BLOG_CONTENT_ROOT, slugToArticleDir, slugToIndexFile } from '@/lib/blog-content/paths';

const toISOString = (value: unknown) => {
  const date = new Date(String(value ?? 0));
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
};

export async function GET(request: Request) {
  const denied = guardLocalApiRequest(request);
  if (denied) return denied;

  const slug = new URL(request.url).searchParams.get('slug');
  if (slug) {
    const parsedSlug = localArticleSchema.shape.slug.safeParse(slug);
    if (!parsedSlug.success) return localApiError('不正なスラッグです', 400);

    try {
      const source = await readFile(slugToIndexFile(parsedSlug.data), 'utf8');
      const { content, data } = matter(source);
      return NextResponse.json({
        body: normalizeWriterMarkdown(content).trim(),
        canonicalUrl: String(data.canonicalUrl ?? ''),
        createdAt: toISOString(data.createdAt).slice(0, 10),
        description: String(data.description ?? ''),
        draft: data.draft !== false,
        eyecatch:
          data.eyecatch && typeof data.eyecatch === 'object'
            ? {
                alt: String(data.eyecatch.alt ?? ''),
                height: typeof data.eyecatch.height === 'number' ? data.eyecatch.height : undefined,
                url: String(data.eyecatch.url ?? ''),
                width: typeof data.eyecatch.width === 'number' ? data.eyecatch.width : undefined,
              }
            : undefined,
        noindex: data.noindex === true,
        seoTitle: String(data.seoTitle ?? ''),
        slug: parsedSlug.data,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        title: String(data.title ?? ''),
        updatedAt: toISOString(data.updatedAt ?? data.createdAt),
      });
    } catch {
      return localApiError('記事が見つかりません', 404);
    }
  }

  const entries = await readdir(BLOG_CONTENT_ROOT, { withFileTypes: true });
  const scannedArticles = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        try {
          const source = await readFile(slugToIndexFile(entry.name), 'utf8');
          const { content, data } = matter(source);
          return {
            body: content,
            description: String(data.description ?? ''),
            draft: data.draft !== false,
            eyecatch: Boolean(data.eyecatch),
            slug: entry.name,
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
            title: String(data.title ?? entry.name),
            updatedAt: toISOString(data.updatedAt ?? data.createdAt),
          };
        } catch {
          return null;
        }
      })
  );
  const articles = scannedArticles.filter((article) => article !== null);
  const library = analyzeWriterLibrary(articles);

  return NextResponse.json({
    articles: articles
      .map(({ body: _body, eyecatch: _eyecatch, ...article }) => ({
        ...article,
        ...library.get(article.slug),
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  });
}

export async function POST(request: Request) {
  const denied = guardLocalApiRequest(request, { mutation: true });
  if (denied) return denied;

  const payload = await request.json();
  const parsed = localArticleSchema.safeParse(payload);
  if (!parsed.success) {
    return localApiError(parsed.error.issues[0]?.message ?? '入力内容を確認してください', 400);
  }

  const articlePath = slugToIndexFile(parsed.data.slug);
  const overwrite = payload.overwrite === true;
  let existingData: Record<string, unknown> = {};
  if (!overwrite) {
    try {
      await access(articlePath, constants.F_OK);
      return localApiError('同じスラッグの記事がすでに存在します', 409);
    } catch {}
  } else {
    try {
      existingData = matter(await readFile(articlePath, 'utf8')).data;
    } catch {}
  }

  await mkdir(slugToArticleDir(parsed.data.slug), { recursive: true });
  const savedAt = new Date();
  await writeFile(articlePath, serializeLocalArticle(parsed.data, savedAt, existingData), 'utf8');

  return NextResponse.json({ path: articlePath, updatedAt: savedAt.toISOString() });
}
