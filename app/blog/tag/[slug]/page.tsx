import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BackLink } from '@/components/atoms';
import { Container } from '@/components/organisms';
import { PostList } from '@/components/organisms/post-list/post-list';
import { siteConfig } from '@/config/site';
import { generateMetadata as generatePageMetadata } from '@/lib/metadata';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';
import { aggregateTags, filterPostsByTags } from '@/lib/tags';

interface Props {
  params: Promise<{ slug: string }>;
}

/* ビルド時に既知のタグ分を SSG する。ビルド後に増えた新規タグは
   dynamicParams のデフォルト(true)によりオンデマンドで生成しキャッシュする */
export const generateStaticParams = async () => {
  const posts = await getAllPostsMetadata();
  /* 日本語タグもそのまま slug にする(Next.js が URL エンコードを処理) */
  return aggregateTags(posts).map(({ tag }) => ({ slug: tag }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const posts = await getAllPostsMetadata();
  const taggedPostCount = filterPostsByTags(posts, [slug]).length;
  return generatePageMetadata({
    title: `タグ: ${slug}`,
    description: `「${slug}」タグの記事一覧 | ${siteConfig.name}`,
    noindex: taggedPostCount < 2,
    url: `${siteConfig.url}/blog/tag/${encodeURIComponent(slug)}`,
  });
};

const TagPage = async ({ params }: Props) => {
  const { slug } = await params;
  const posts = await getAllPostsMetadata();
  const filtered = filterPostsByTags(posts, [slug]);

  if (filtered.length === 0) {
    notFound();
  }

  return (
    <Container maxWidth="4xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">タグ</p>
          <h1 className="scroll-m-20 text-3xl font-bold text-foreground">{slug}</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} 件の記事</p>
        </div>
        <PostList posts={filtered} prioritizeFirst />
        <div className="text-end">
          <BackLink href="/blog" label="ブログ一覧に戻る" />
        </div>
      </div>
    </Container>
  );
};

export default TagPage;
