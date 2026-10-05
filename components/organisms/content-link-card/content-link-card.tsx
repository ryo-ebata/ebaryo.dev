import type { LinkCardKind } from '@/lib/link-card';
import { getLinkCardMetadata } from '@/lib/link-preview';
import { LinkCardView } from './link-card-view';

interface ContentLinkCardProps {
  className?: string;
  kind?: LinkCardKind;
  label?: string;
  url: string;
}

const FallbackCard = ({ className, kind, label, url }: ContentLinkCardProps) => {
  const shortUrl = kind === 'internal' ? 'blog.p1ass.com' : new URL(url).hostname;

  return (
    <LinkCardView
      className={className}
      description={kind === 'internal' ? 'このブログ内の記事' : url}
      kind={kind ?? 'external'}
      siteName={shortUrl}
      title={label || shortUrl}
      url={url}
    />
  );
};

export const ContentLinkCard = async ({
  className,
  kind = 'external',
  label,
  url,
}: ContentLinkCardProps) => {
  const metadata = await getLinkCardMetadata({ display: label || url, href: url, kind });
  if (!metadata) return <FallbackCard className={className} kind={kind} label={label} url={url} />;

  return (
    <LinkCardView
      className={className}
      description={metadata.description}
      image={metadata.image}
      kind={kind}
      siteName={metadata.siteName}
      title={metadata.title}
      url={url}
    />
  );
};
