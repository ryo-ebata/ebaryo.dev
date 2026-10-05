'use client';

import { Separator } from '@/components/atoms/separator';
import { siteConfig } from '@/config/site';

const footerLinks = [
  { href: siteConfig.links.github, label: 'GitHub' },
  { href: siteConfig.links.zenn, label: 'Zenn' },
  { href: siteConfig.links.qiita, label: 'Qiita' },
  { href: siteConfig.links.twitter, label: 'X' },
];

/** サイト開設年。これ以降は現在年までのレンジで著作権表記する。 */
const FOUNDING_YEAR = 2025;

const getCopyrightYears = (): string => {
  const currentYear = new Date().getFullYear();
  return currentYear > FOUNDING_YEAR ? `${FOUNDING_YEAR}–${currentYear}` : `${FOUNDING_YEAR}`;
};

export const Footer = () => (
  <footer className="relative overflow-hidden bg-background/95">
    <Separator />
    <div
      className="pointer-events-none absolute left-1/2 top-0 h-20 w-40 -translate-x-1/2 opacity-40"
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-0 h-14 w-px -rotate-45 bg-primary/60" />
      <div className="absolute left-10 top-5 size-3 rotate-45 border border-primary" />
      <div className="absolute right-9 top-8 size-2 bg-[var(--geometry-secondary)]" />
    </div>
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        {footerLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <p className="mt-6 text-center text-sm text-muted-foreground" suppressHydrationWarning>
        © {getCopyrightYears()} {siteConfig.name}. All rights reserved.
      </p>
    </div>
  </footer>
);
