import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BackLink } from '@/components/atoms';
import { Container } from '@/components/organisms';
import { PostList } from '@/components/organisms/post-list/post-list';
import { siteConfig } from '@/config/site';
import { getAllPostsMetadata } from '@/lib/blog-content/blog';
import { generateMetadata as generatePageMetadata } from '@/lib/metadata';
import { contentThemes, getThemeBySlug, getThemePosts } from '@/lib/themes';

interface ThemePageProps {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = () => contentThemes.map(({ slug }) => ({ slug }));

export const generateMetadata = async ({ params }: ThemePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) {
    return {};
  }

  return generatePageMetadata({
    description: theme.description,
    title: theme.name,
    url: `${siteConfig.url}/blog/theme/${theme.slug}`,
  });
};

const ThemePage = async ({ params }: ThemePageProps) => {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) {
    notFound();
  }

  const posts = getThemePosts(theme, await getAllPostsMetadata());
  if (posts.length === 0) {
    notFound();
  }

  return (
    <Container maxWidth="4xl">
      <div className="space-y-8">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">テーマ</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{theme.name}</h1>
          <p className="leading-7 text-muted-foreground">{theme.description}</p>
          <p className="text-sm text-muted-foreground">{posts.length}件の記事</p>
        </header>
        <PostList posts={posts} prioritizeFirst />
        <div className="text-end">
          <BackLink href="/blog" label="ブログ一覧に戻る" />
        </div>
      </div>
    </Container>
  );
};

export default ThemePage;
