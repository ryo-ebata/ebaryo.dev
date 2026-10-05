'use client';

import { Link } from 'next-view-transitions';
import { trackProductEvent } from '@/lib/analytics';
import { getThemesForTags } from '@/lib/themes';

interface ArticleThemeLinksProps {
  tags?: string[];
}

export const ArticleThemeLinks = ({ tags }: ArticleThemeLinksProps) => {
  const themes = getThemesForTags(tags);
  if (themes.length === 0) {
    return null;
  }

  return (
    <nav aria-label="この記事のテーマ" className="rounded-xl border border-border bg-muted/30 p-5">
      <p className="text-sm font-medium text-foreground">このテーマを続けて読む</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {themes.map((theme) => {
          const href = `/blog/theme/${theme.slug}`;
          return (
            <Link
              key={theme.slug}
              href={href}
              className="rounded-full bg-background px-3 py-1.5 text-sm text-foreground ring-1 ring-border transition-colors hover:bg-muted"
              onClick={() =>
                trackProductEvent('content_link_click', {
                  destination_path: href,
                  placement: 'article_theme',
                })
              }
            >
              {theme.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
