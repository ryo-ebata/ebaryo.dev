import Link from 'next/link';
import { Container } from '@/components/organisms';
import type { BaseContentMetadata } from '@/lib/content';
import { Time } from '@/components/atoms/time/time';
import { Separator } from '@/components/atoms/separator';

interface SitemapPresenterProps {
  posts: BaseContentMetadata[];
}

const staticPages = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
] as const;

export const SitemapPresenter = ({ posts }: SitemapPresenterProps) => (
  <Container maxWidth="4xl">
    <div className="space-y-12">
      <div className="page-heading mb-12">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">Index / All routes</p>
        <h1 className="font-bold scroll-m-20 text-4xl tracking-[-0.035em] text-foreground">
          サイトマップ
        </h1>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="section-heading font-semibold scroll-m-20 text-lg text-foreground">
            ページ
          </h2>
          <Separator />
        </div>
        <ul className="geometric-panel bg-card text-card-foreground overflow-hidden divide-y divide-foreground/10">
          {staticPages.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="flex items-center px-4 py-3 text-sm text-primary transition-colors hover:bg-muted hover:text-primary/80"
              >
                {page.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="section-heading font-semibold scroll-m-20 text-lg text-foreground">
            記事
          </h2>
          <Separator />
        </div>
        <ul className="geometric-panel bg-card text-card-foreground overflow-hidden divide-y divide-foreground/10">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="text-sm text-primary transition-colors hover:text-primary/80"
              >
                {post.title}
              </Link>
              <Time date={post.createdAt} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  </Container>
);
