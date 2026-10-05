import { ArrowUpRight, BookOpen } from 'lucide-react';
import { isAmazonJapanUrl } from '@/lib/amazon-affiliate';
import type { LinkCardKind } from '@/lib/link-card';
import { cn } from '@/lib/utils';
import styles from './link-card-view.module.css';

interface LinkCardViewProps {
  className?: string;
  description?: string;
  image?: string;
  kind: LinkCardKind;
  siteName: string;
  title: string;
  url: string;
}

const getExternalRel = (url: string, kind: LinkCardKind) =>
  kind === 'external'
    ? isAmazonJapanUrl(url)
      ? 'nofollow noopener noreferrer sponsored'
      : 'noopener noreferrer'
    : undefined;

const getLinkLabel = (url: string, kind: LinkCardKind): string => {
  if (isAmazonJapanUrl(url)) return '広告・Amazon';
  return kind === 'internal' ? '内部リンク' : '外部リンク';
};

export const LinkCardView = ({
  className,
  description,
  image,
  kind,
  siteName,
  title,
  url,
}: LinkCardViewProps) => (
  <a
    className={cn('not-prose group w-full', styles.card, !image && styles.withoutImage, className)}
    data-kind={kind}
    href={url}
    rel={getExternalRel(url, kind)}
    target={kind === 'external' ? '_blank' : undefined}
  >
    <span className={styles.content}>
      <span className={styles.metadata}>
        {kind === 'internal' ? (
          <BookOpen className={styles.icon} aria-hidden="true" />
        ) : (
          <ArrowUpRight className={styles.icon} aria-hidden="true" />
        )}
        <span className={styles.siteName}>{siteName}</span>
        <span className={styles.badge}>{getLinkLabel(url, kind)}</span>
      </span>
      <strong className={styles.title}>{title}</strong>
      {description && <small className={styles.description}>{description}</small>}
    </span>
    {image && (
      <span className={styles.media} aria-hidden="true">
        <img
          alt=""
          className={styles.image}
          decoding="async"
          height="630"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={image}
          width="1200"
        />
      </span>
    )}
  </a>
);
