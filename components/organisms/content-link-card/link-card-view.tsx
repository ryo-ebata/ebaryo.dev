import { ArrowUpRight, BookOpen } from 'lucide-react';
import { isAmazonJapanUrl } from '@/lib/amazon-affiliate';
import type { LinkCardKind } from '@/lib/link-card';
import { cn } from '@/lib/utils';

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
    className={cn(
      'not-prose group my-6 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 text-card-foreground no-underline',
      'transition-colors hover:border-foreground/25 hover:bg-muted/35',
      className
    )}
    href={url}
    rel={getExternalRel(url, kind)}
    target={kind === 'external' ? '_blank' : undefined}
  >
    <span className="grid min-w-0 gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {kind === 'internal' ? (
          <BookOpen className="size-3.5 text-primary" />
        ) : (
          <ArrowUpRight className="size-3.5 text-primary" />
        )}
        <span className="truncate">{siteName}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium">
          {isAmazonJapanUrl(url)
            ? '広告・Amazon'
            : kind === 'internal'
              ? '内部リンク'
              : '外部リンク'}
        </span>
      </span>
      <strong className="truncate text-sm font-semibold text-foreground">{title}</strong>
      {description && (
        <small className="line-clamp-2 text-xs leading-5 text-muted-foreground">
          {description}
        </small>
      )}
    </span>
    {image && (
      <img
        alt={title}
        className="h-[4.5rem] w-28 rounded-md object-cover"
        loading="lazy"
        src={image}
      />
    )}
  </a>
);
