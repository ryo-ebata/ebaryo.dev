import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { envConfig } from '@/config/env';
import { logger } from '@/lib/logger';
import { getAllPostsMetadata, getPostBySlug } from '@/lib/blog-content/blog';
import { isValidRevalidationAuthorization } from '@/lib/revalidate-auth';
import { aggregateTags } from '@/lib/tags';

const UNAUTHORIZED_STATUS = 401;
const INTERNAL_ERROR_STATUS = 500;

export const POST = async (request: NextRequest) => {
  if (
    !isValidRevalidationAuthorization(
      request.headers.get('authorization'),
      envConfig.revalidate.REVALIDATE_SECRET
    )
  ) {
    return Response.json({ message: 'Invalid token' }, { status: UNAUTHORIZED_STATUS });
  }

  try {
    const { slug } = await request.json();

    /* データキャッシュされた記事層(getAllPostsMetadata/getPostBySlug)を
       無効化する。revalidatePathはHTML出力のキャッシュを消すのみで、データ
       キャッシュ自体はrevalidateTagを呼ばない限り古いまま残るため必須。
       記事一覧と記事詳細はpostsタグを共有するため、記事更新時はまとめて無効化する。 */
    if (slug) {
      /* 特定の記事と、そのタグが付くタグ一覧ページを再検証する。
         新規タグの場合は dynamicParams のデフォルト挙動でオンデマンド生成される */
      revalidateTag('posts', 'max');
      revalidatePath(`/blog/${slug}`);
      const { metadata } = await getPostBySlug(slug);
      for (const tag of metadata.tags ?? []) {
        revalidatePath(`/blog/tag/${tag}`);
      }
    } else {
      /* 記事の対応関係が不明なため、全記事のキャッシュとブログ一覧・
         全タグ一覧ページを再検証する */
      revalidateTag('posts', 'max');
      revalidatePath('/blog');
      const posts = await getAllPostsMetadata();
      for (const { tag } of aggregateTags(posts)) {
        revalidatePath(`/blog/tag/${tag}`);
      }
    }

    return Response.json({ now: Date.now(), revalidated: true });
  } catch (error) {
    logger.error('再検証に失敗しました', { source: 'revalidate' }, error);
    return Response.json({ message: 'Error' }, { status: INTERNAL_ERROR_STATUS });
  }
};
