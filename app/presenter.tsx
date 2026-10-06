import { ArrowUpRight, Github, PenLine, Shapes } from 'lucide-react';
import { Link } from 'next-view-transitions';
import type { ReactNode } from 'react';

import { Container } from '@/components/organisms/container';
import type { BaseContentMetadata } from '@/lib/content';
import { formatDate } from '@/lib/date';
import type { ExternalArticleItem } from '@/lib/external-thumbnail';

import styles from './home.module.css';

interface HomePresenterProps {
  articles: ExternalArticleItem[];
  posts: BaseContentMetadata[];
}

interface ActivityItem {
  date: string;
  href: string;
  source: 'Blog' | 'Qiita' | 'Zenn';
  title: string;
}

const getExternalActivity = (item: ExternalArticleItem): ActivityItem => {
  if (item.type === 'zenn') {
    return {
      date: item.article.published_at,
      href: `https://zenn.dev${item.article.path}`,
      source: 'Zenn',
      title: item.article.title,
    };
  }

  return {
    date: item.article.created_at,
    href: item.article.url,
    source: 'Qiita',
    title: item.article.title,
  };
};

const getRecentActivity = (
  posts: BaseContentMetadata[],
  articles: ExternalArticleItem[]
): ActivityItem[] => {
  const internalActivity = posts.slice(1).map((post) => ({
    date: post.createdAt,
    href: `/blog/${post.slug}`,
    source: 'Blog' as const,
    title: post.title,
  }));

  return [...internalActivity, ...articles.map(getExternalActivity)]
    .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
    .slice(0, 5);
};

const FieldDiagram = ({ tags }: { tags: string[] }) => (
  <div className={styles.diagram} aria-hidden="true">
    <span className={styles.diagramStamp}>FIELD / 043</span>
    <span className={styles.diagramStatus}>IN MOTION</span>
    <svg viewBox="0 0 460 390" role="presentation">
      <path className={styles.orbit} d="M68 207 171 58l218 75-42 198-223 20Z" />
      <path className={styles.axis} d="M38 300 422 86M83 73l293 268" />
      <path className={styles.signal} d="m68 207 103-47 72 76 104-81 42-22" />
      <circle className={styles.core} cx="243" cy="236" r="48" />
      <circle className={styles.node} cx="68" cy="207" r="8" />
      <rect className={styles.square} x="158" y="47" width="26" height="26" />
      <circle className={styles.node} cx="389" cy="133" r="8" />
      <path className={styles.diamond} d="m347 316 15 15-15 15-15-15Z" />
      <text x="39" y="190">
        WRITE
      </text>
      <text x="145" y="35">
        BUILD
      </text>
      <text x="359" y="117">
        SHARE
      </text>
      <text x="304" y="372">
        CONTRIBUTE
      </text>
      <text className={styles.monogram} x="208" y="247">
        E
      </text>
    </svg>
    <div className={styles.diagramTags}>
      {tags.slice(0, 3).map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  </div>
);

const HomeHero = ({ latestPost }: { latestPost?: BaseContentMetadata }) => (
  <section className={styles.hero} aria-labelledby="home-title">
    <div className={styles.heroCopy}>
      <p className={styles.kicker}>Web engineer / ebaryo</p>
      <h1 id="home-title">
        <span>作って、試して、</span>
        <span>書く。</span>
      </h1>
      <p className={styles.introduction}>
        Web開発、データ、生成AI、Rustあたりを触っている。作ったものと、仕事や個人開発で考えたことを置いている。
      </p>
      <div className={styles.heroLinks}>
        {latestPost && (
          <Link href={`/blog/${latestPost.slug}`} className={styles.primaryLink}>
            新しい記事を読む
            <ArrowUpRight aria-hidden="true" />
          </Link>
        )}
        <Link href="/portfolio" className={styles.textLink}>
          作ったものを見る
        </Link>
      </div>
    </div>
    <FieldDiagram tags={latestPost?.tags ?? []} />
  </section>
);

const CurrentNote = ({ post }: { post: BaseContentMetadata }) => (
  <section className={styles.currentNote} aria-labelledby="current-note-title">
    <div className={styles.sectionIndex}>
      <span>新しい記事</span>
      <span>01</span>
    </div>
    <div className={styles.noteComposition}>
      <div className={styles.noteRail} aria-hidden="true">
        <span>EBARYO.DEV</span>
        <strong>NEW</strong>
        <span>VOL. 01</span>
      </div>
      <Link href={`/blog/${post.slug}`} className={styles.currentNoteLink}>
        <div className={styles.noteMeta}>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          {post.tags?.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <h2 id="current-note-title">{post.title}</h2>
        {post.description && <p>{post.description}</p>}
        <span className={styles.readLabel}>
          記事を読む
          <ArrowUpRight aria-hidden="true" />
        </span>
      </Link>
      <div className={styles.noteGeometry} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  </section>
);

const ActivityLog = ({ items }: { items: ActivityItem[] }) => (
  <section className={styles.activity} aria-labelledby="activity-title">
    <div className={styles.sectionIndex}>
      <h2 id="activity-title">最近の投稿</h2>
      <span>02</span>
    </div>
    <div className={styles.activityList}>
      {items.map((item) => {
        const isExternal = item.source !== 'Blog';
        return (
          <Link
            key={`${item.source}-${item.href}`}
            href={item.href}
            className={styles.activityItem}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <time dateTime={item.date}>{formatDate(item.date)}</time>
            <span className={styles.source}>{item.source}</span>
            <span className={styles.activityTitle}>{item.title}</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        );
      })}
    </div>
    <Link href="/blog" className={styles.archiveLink}>
      記事を探す
      <ArrowUpRight aria-hidden="true" />
    </Link>
  </section>
);

const PracticeItem = ({
  children,
  description,
  href,
  icon,
  title,
  variant,
}: {
  children: ReactNode;
  description: string;
  href: string;
  icon: ReactNode;
  title: string;
  variant: 'build' | 'contribute' | 'write';
}) => (
  <Link href={href} className={`${styles.practiceItem} ${styles[variant]}`}>
    <span className={styles.liveStatus}>Active</span>
    <span className={styles.practiceIcon}>{icon}</span>
    <span className={styles.practiceBody}>
      <strong>{title}</strong>
      <span>{description}</span>
      <small>{children}</small>
    </span>
    <ArrowUpRight aria-hidden="true" />
    <span className={styles.practiceGeometry} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  </Link>
);

const Practice = () => (
  <section className={styles.practice} aria-labelledby="practice-title">
    <div className={styles.sectionIndex}>
      <h2 id="practice-title">やっていること</h2>
      <span>03</span>
    </div>
    <div className={styles.practiceGrid}>
      <PracticeItem
        href="/blog"
        icon={<PenLine aria-hidden="true" />}
        title="Write"
        description="試したことや考えたことを書く"
        variant="write"
      >
        Blog / Zenn / Qiita
      </PracticeItem>
      <PracticeItem
        href="/portfolio"
        icon={<Shapes aria-hidden="true" />}
        title="Build"
        description="欲しい道具やプロダクトを作る"
        variant="build"
      >
        Product / OSS / Talk
      </PracticeItem>
      <PracticeItem
        href="/portfolio"
        icon={<Github aria-hidden="true" />}
        title="Contribute"
        description="使っているOSSに手を入れる"
        variant="contribute"
      >
        GitHub contributions
      </PracticeItem>
    </div>
  </section>
);

export function HomePresenter({ articles, posts }: HomePresenterProps) {
  const [latestPost] = posts;
  const activity = getRecentActivity(posts, articles);

  return (
    <Container maxWidth="4xl">
      <div className={styles.home}>
        <HomeHero latestPost={latestPost} />
        {latestPost && <CurrentNote post={latestPost} />}
        {activity.length > 0 && <ActivityLog items={activity} />}
        <Practice />
      </div>
    </Container>
  );
}
