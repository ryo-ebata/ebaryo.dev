import { notFound } from 'next/navigation';
import { Separator } from '@/components/atoms/separator';
import { Container } from '@/components/organisms';
import { ArticlePresentation } from '@/components/organisms/article-presentation/article-presentation';
import { PromoBlock } from '@/components/organisms/promo-block/promo-block';
import { JsonLd } from '@/components/jsonld/jsonld';
import { Breadcrumb } from '@/components/molecules/breadcrumb/breadcrumb';
import { ReadingProgress } from '@/components/molecules/reading-progress/reading-progress';
import { ShareButtons } from '@/components/molecules/share-buttons/share-buttons';
import { GiscusComments } from '@/components/organisms/comments/giscus-comments';
import { AuthorBio } from '@/components/organisms/author-bio/author-bio';
import { NewsletterForm } from '@/components/molecules/newsletter-form/newsletter-form';
import { isNewsletterEnabled } from '@/config/newsletter';
import { siteConfig } from '@/config/site';
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from '@/lib/jsonld';
import { getAllPostsMetadata, getPostBySlug } from '@/lib/blog-content/blog';
import { renderMarkdownContent } from '@/lib/blog-content/content-renderer';
import { getRelatedPosts } from '@/lib/related';
import { PostList } from '@/components/organisms/post-list/post-list';
import { TableOfContents } from '@/components/organisms/table-of-contents/table-of-contents';
import { ArticleEngagementTracker } from '@/components/molecules/article-engagement-tracker/article-engagement-tracker';
import { ArticleThemeLinks } from '@/components/molecules/article-theme-links/article-theme-links';

interface BlogPostContainerProps {
  slug: string[];
}

export const BlogPostContainer = async ({ slug }: BlogPostContainerProps) => {
  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound();
    }

    const postUrl = `${siteConfig.url}/blog/${post.metadata.slug}`;
    const articleJsonLd = generateArticleJsonLd(
      { ...post.metadata, title: post.metadata.seoTitle ?? post.metadata.title },
      post.metadata.canonicalUrl ?? postUrl,
      post.contentMarkdown
    );
    const [{ content, toc }, allPosts] = await Promise.all([
      renderMarkdownContent(post.contentMarkdown, post.metadata.slug),
      getAllPostsMetadata(),
    ]);
    const relatedPosts = getRelatedPosts(post.metadata, allPosts, 3);

    const { title: postTitle } = post.metadata;

    const breadcrumbItems = [
      { name: 'Home', href: '/' },
      { name: 'ブログ', href: '/blog' },
      { name: postTitle },
    ];
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
      { name: 'Home', url: siteConfig.url },
      { name: 'ブログ', url: `${siteConfig.url}/blog` },
      { name: postTitle, url: postUrl },
    ]);

    return (
      <>
        <JsonLd data={articleJsonLd} />
        <JsonLd data={breadcrumbJsonLd} />
        <ArticleEngagementTracker slug={post.metadata.slug} />
        <ReadingProgress />
        <Container maxWidth="3xl">
          <Breadcrumb items={breadcrumbItems} />
          <ArticlePresentation
            metadata={post.metadata}
            beforeContent={
              <>
                <PromoBlock placement="article-top" />
                <div className="mx-auto max-w-[42rem]">
                  <TableOfContents items={toc} />
                </div>
              </>
            }
          >
            {content}
          </ArticlePresentation>
          <div className="mx-auto mt-8 max-w-[42rem]">
            <ArticleThemeLinks tags={post.metadata.tags} />
          </div>
          <div className="mx-auto mt-6 max-w-[42rem]">
            <ShareButtons url={postUrl} title={postTitle} />
          </div>
          <div className="mx-auto mt-8 max-w-[42rem]">
            <AuthorBio />
          </div>
          <PromoBlock placement="article-bottom" />
          {relatedPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-5 text-lg font-semibold text-foreground">関連記事</h2>
              <PostList posts={relatedPosts} trackingPlacement="related_posts" />
            </section>
          )}
          {isNewsletterEnabled && (
            <div className="mx-auto mt-12 max-w-[42rem]">
              <NewsletterForm />
            </div>
          )}
          <Separator />
          <GiscusComments />
        </Container>
      </>
    );
  } catch {
    notFound();
  }
};
