import type { Metadata } from 'next';
import { ArrowUpRight, Github, Mic2, PackageOpen, Presentation, Shapes } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/atoms/badge';
import { Container } from '@/components/organisms';
import {
  portfolioCategoryLabels,
  portfolioItems,
  type PortfolioCategory,
  type PortfolioItem,
} from '@/config/portfolio';
import { githubContributions, type GithubContributionItem } from '@/config/github-contributions';
import styles from './portfolio.module.css';

export const metadata: Metadata = {
  description: '自作OSS、個人開発、OSSコントリビュート、Podcast、登壇資料の実績一覧',
  title: 'Portfolio',
};

const categoryIcons: Record<PortfolioCategory, ReactNode> = {
  'open-source': <PackageOpen className="size-4" aria-hidden="true" />,
  contribution: <Github className="size-4" aria-hidden="true" />,
  podcast: <Mic2 className="size-4" aria-hidden="true" />,
  product: <Shapes className="size-4" aria-hidden="true" />,
  talk: <Presentation className="size-4" aria-hidden="true" />,
};

const categoryStyles: Record<PortfolioCategory, { card: string; label: string }> = {
  'open-source': {
    card: 'ring-orange-500/25 bg-[linear-gradient(145deg,var(--card)_58%,color-mix(in_oklab,var(--color-orange-500)_8%,var(--card)))]',
    label: 'text-orange-700 dark:text-orange-300',
  },
  contribution: {
    card: 'ring-violet-500/30 bg-[linear-gradient(145deg,var(--card)_58%,color-mix(in_oklab,var(--color-violet-500)_9%,var(--card)))]',
    label: 'text-violet-700 dark:text-violet-300',
  },
  podcast: {
    card: 'ring-rose-500/25 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklab,var(--color-rose-500)_10%,var(--card)),var(--card)_48%)]',
    label: 'text-rose-700 dark:text-rose-300',
  },
  product: {
    card: 'ring-sky-500/25 bg-[linear-gradient(160deg,var(--card)_55%,color-mix(in_oklab,var(--color-sky-500)_9%,var(--card)))]',
    label: 'text-sky-700 dark:text-sky-300',
  },
  talk: {
    card: 'ring-amber-500/25 bg-[linear-gradient(125deg,var(--card)_60%,color-mix(in_oklab,var(--color-amber-500)_10%,var(--card)))]',
    label: 'text-amber-700 dark:text-amber-300',
  },
};

const CategoryGeometry = ({ category }: { category: PortfolioCategory }) => {
  const commonClassName = `pointer-events-none absolute right-0 top-0 h-36 w-44 opacity-35 ${styles.geometry}`;

  if (category === 'open-source') {
    return (
      <svg
        viewBox="0 0 176 144"
        className={`${commonClassName} text-orange-500`}
        aria-hidden="true"
      >
        <path
          className={`${styles.shape} ${styles.openSourceTop}`}
          d="m105 12 30 17-30 17-30-17 30-17Z"
          fill="currentColor"
          fillOpacity=".18"
        />
        <path
          className={`${styles.shape} ${styles.openSourceBody}`}
          d="m75 29 30 17v35L75 64V29Zm60 0-30 17v35l30-17V29Z"
          fill="none"
          stroke="currentColor"
        />
        <path
          className={`${styles.line} ${styles.openSourceSatellites}`}
          d="m143 72 21 12-21 12-21-12 21-12Zm-82 16 25 14-25 14-25-14 25-14Z"
          fill="none"
          stroke="currentColor"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  if (category === 'product') {
    return (
      <svg viewBox="0 0 176 144" className={`${commonClassName} text-sky-500`} aria-hidden="true">
        <path
          className={`${styles.shape} ${styles.productHull}`}
          d="M56 28 110 15l42 40-14 57-57 16-48-35 23-65Z"
          fill="currentColor"
          fillOpacity=".08"
          stroke="currentColor"
        />
        <path
          className={`${styles.line} ${styles.productGrid}`}
          d="m56 28 25 100m29-113 28 97M33 93l119-38"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".6"
        />
        <circle
          className={`${styles.node} ${styles.productNodeA}`}
          cx="56"
          cy="28"
          r="6"
          fill="currentColor"
        />
        <circle
          className={`${styles.node} ${styles.productNodeB}`}
          cx="152"
          cy="55"
          r="5"
          fill="currentColor"
        />
        <circle
          className={`${styles.node} ${styles.productNodeC}`}
          cx="81"
          cy="128"
          r="7"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (category === 'contribution') {
    return (
      <svg
        viewBox="0 0 176 144"
        className={`${commonClassName} text-violet-500`}
        aria-hidden="true"
      >
        <path
          className={`${styles.line} ${styles.contributionPrimary}`}
          d="M36 18v45c0 18 12 27 31 27h55c14 0 22 8 22 22v17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className={`${styles.line} ${styles.contributionBranch}`}
          d="M36 63c0 18 12 27 31 27h22c14 0 22-8 22-22V34"
          fill="none"
          stroke="currentColor"
          strokeDasharray="5 5"
        />
        <rect
          className={`${styles.node} ${styles.contributionStart}`}
          x="28"
          y="10"
          width="16"
          height="16"
          rx="2"
          fill="currentColor"
          fillOpacity=".2"
          stroke="currentColor"
        />
        <path
          className={`${styles.node} ${styles.contributionEnds}`}
          d="m111 24 10 10-10 10-10-10 10-10Zm33 95 10 10-10 10-10-10 10-10Z"
          fill="currentColor"
          fillOpacity=".2"
          stroke="currentColor"
        />
      </svg>
    );
  }

  if (category === 'podcast') {
    return (
      <svg viewBox="0 0 176 144" className={`${commonClassName} text-rose-500`} aria-hidden="true">
        <circle
          className={`${styles.node} ${styles.podcastCore}`}
          cx="121"
          cy="52"
          r="13"
          fill="currentColor"
          fillOpacity=".2"
          stroke="currentColor"
        />
        <circle
          className={`${styles.orbit} ${styles.podcastOrbitInner}`}
          cx="121"
          cy="52"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeDasharray="3 5"
        />
        <circle
          className={`${styles.orbit} ${styles.podcastOrbitOuter}`}
          cx="121"
          cy="52"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".55"
        />
        <path
          className={`${styles.line} ${styles.podcastWave}`}
          d="M20 110h12l7-26 10 45 10-30 9 11h18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 176 144" className={`${commonClassName} text-amber-500`} aria-hidden="true">
      <path
        className={`${styles.shape} ${styles.talkPlane}`}
        d="m69 16 91 22-23 81-91-22 23-81Z"
        fill="currentColor"
        fillOpacity=".08"
        stroke="currentColor"
      />
      <path
        className={`${styles.line} ${styles.talkGrid}`}
        d="m91 23 25 96M53 59l95 23"
        fill="none"
        stroke="currentColor"
        strokeDasharray="5 5"
      />
      <path
        className={`${styles.shape} ${styles.talkProjector}`}
        d="m21 124 38-22 38 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        className={`${styles.node} ${styles.talkNode}`}
        cx="59"
        cy="102"
        r="7"
        fill="currentColor"
      />
    </svg>
  );
};

const PortfolioHero = () => (
  <header className="page-heading relative mb-12 overflow-hidden sm:mb-16">
    <div
      className="pointer-events-none absolute right-0 top-0 size-40 opacity-60 sm:size-56"
      aria-hidden="true"
    >
      <div className="absolute right-2 top-2 size-24 rotate-12 rounded-[2rem] border border-primary/25 sm:size-36" />
      <div className="absolute right-12 top-12 size-16 rotate-45 bg-primary/10 sm:size-24" />
      <div className="absolute right-4 top-24 size-10 rounded-full border border-foreground/20 sm:top-32 sm:size-16" />
    </div>
    <div className="relative max-w-2xl space-y-5">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary">
        Portfolio / Selected work
      </p>
      <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
        <span className="block">作ったもの。</span>
      </h1>
      <p className="max-w-xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
        自作OSS、個人開発、OSSへのコントリビュート、Podcast、登壇資料をまとめている。
      </p>
    </div>
  </header>
);

const WorkLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
  >
    {label}
    <ArrowUpRight className="size-3.5" aria-hidden="true" />
  </Link>
);

const PortfolioCard = ({ item }: { item: PortfolioItem }) => (
  <article
    className={`group relative overflow-hidden rounded-2xl p-6 ring-1 sm:p-8 ${categoryStyles[item.category].card}`}
  >
    <CategoryGeometry category={item.category} />
    <div className="relative space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {categoryIcons[item.category]}
          <span>{portfolioCategoryLabels[item.category]}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{item.year}</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {item.title}
        </h2>
        <p
          className={`text-xs font-medium uppercase tracking-wider ${categoryStyles[item.category].label}`}
        >
          {item.role}
        </p>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
      <div className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="font-normal">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-foreground/10 pt-5">
        {item.links.map((link) => (
          <WorkLink key={link.href} {...link} />
        ))}
      </div>
    </div>
  </article>
);

const ContributionCard = ({ item }: { item: GithubContributionItem }) => (
  <article
    className={`group relative overflow-hidden rounded-2xl p-6 ring-1 sm:p-8 ${categoryStyles.contribution.card}`}
  >
    <CategoryGeometry category="contribution" />
    <div className="relative space-y-5">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-2">
          <Github className="size-4" aria-hidden="true" />
          OSS Contribution
        </span>
        <span className="font-mono">GitHub</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {item.repository}
        </h2>
        <p
          className={`text-xs font-medium uppercase tracking-wider ${categoryStyles.contribution.label}`}
        >
          Contributor
        </p>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">
        コード、Issue、レビューなどで関わったOSS。
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          ['Commits', item.commits],
          ['Issues', item.issues],
          ['Pull Requests', item.pullRequests],
          ['Reviews', item.reviews],
        ]
          .filter(([, value]) => Number(value) > 0)
          .map(([label, value]) => (
            <Badge key={label} variant="secondary" className="font-normal">
              {label} {value}
            </Badge>
          ))}
      </div>
      {item.highlights.length > 0 && (
        <ul className="grid gap-2 border-t border-foreground/10 pt-5">
          {item.highlights.slice(0, 2).map((highlight) => (
            <li key={highlight.url}>
              <Link
                href={highlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-start gap-2 text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] uppercase">
                  {highlight.type === 'pull-request' ? 'PR' : 'Issue'}
                </Badge>
                <span className="line-clamp-2">{highlight.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className={item.highlights.length > 0 ? '' : 'border-t border-foreground/10 pt-5'}>
        <WorkLink href={item.repositoryUrl} label="Repository" />
      </div>
    </div>
  </article>
);

const visibleContributions = githubContributions.items.filter((item) => item.visible);
const activityCount = portfolioItems.length + visibleContributions.length;

const PortfolioPage = () => (
  <Container maxWidth="4xl">
    <PortfolioHero />
    <section className="py-12 sm:py-16" aria-labelledby="selected-work-heading">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Selected work
          </p>
          <h2
            id="selected-work-heading"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            一覧
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{activityCount} entries</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {portfolioItems.map((item) => (
          <PortfolioCard key={`${item.category}-${item.title}`} item={item} />
        ))}
        {visibleContributions.map((item) => (
          <ContributionCard key={item.repository} item={item} />
        ))}
      </div>
    </section>
    <aside className="mb-8 flex flex-col gap-4 rounded-2xl border border-dashed border-foreground/20 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 className="font-semibold text-foreground">GitHubもあります</h2>
        <p className="text-sm text-muted-foreground">コードやIssueなどはGitHubで見られる。</p>
      </div>
      <WorkLink href="https://github.com/ryo-ebata" label="GitHub Profile" />
    </aside>
  </Container>
);

export default PortfolioPage;
