'use client';

import { TagList } from '@/components/molecules/tag-list';
import { Time } from '@/components/atoms/time/time';
import {
  markEyecatchViewTransition,
  useEyecatchViewTransitionSlug,
} from '@/lib/view-transition-slug';
import Image from 'next/image';
import { Link } from 'next-view-transitions';
import { useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';

const ICON_SIZE = 48;
const DEFAULT_EYECATCH_PATH = '/image/default-eyecatch.svg';

/* cacheComponents(Activity)有効化後、一覧ページはクライアント内遷移では
   アンマウントされずDOMごと保持されるようになった。そのため前回クリックで
   直接DOMへ書き込んだview-transition-nameは、対象カードが再レンダーされない
   限り自然には消えず、次に別記事をクリックしても残り続けてしまう。
   モジュールスコープで直前にマークした要素を追跡し、新しいカードをクリック
   した際に明示的にクリアすることで、常に1枚のカードだけがモーフィング対象
   になるようにする。WeakRefにしているのは、検索・タグ絞り込みでカードが
   DOMから切り離された後もこの変数が強参照として掴み続け、GCを妨げないため。 */
let lastMarkedEyecatchElementRef: WeakRef<HTMLDivElement> | null = null;

export type ArticleCardIconType =
  | { emoji: string; type: 'emoji' }
  | { alt: string; src: string; type: 'image' };

export interface ArticleCardProps {
  date: string;
  description?: string;
  eyecatch?: { url: string; height?: number; width?: number };
  href: string;
  icon?: ArticleCardIconType;
  isExternal?: boolean;
  priority?: boolean;
  slug?: string;
  tags?: string[];
  title: string;
  updatedAt?: string;
  onNavigate?: () => void;
}

function getExternalLinkProps(isExternal: boolean): { rel?: string; target?: string } {
  if (isExternal) {
    return { rel: 'noopener noreferrer', target: '_blank' };
  }
  return {};
}

function CardBackground({
  eyecatch,
  priority = false,
}: Pick<ArticleCardProps, 'eyecatch' | 'priority'>) {
  if (eyecatch?.url) {
    return (
      <Image
        src={eyecatch.url}
        alt=""
        fill
        sizes="(min-width: 640px) 420px, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority={priority}
        unoptimized={
          eyecatch.url.startsWith('/og?') || eyecatch.url.startsWith('/external-thumbnails/')
        }
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted transition-transform duration-500 group-hover:scale-105" />
  );
}

function CardIcon({ icon, priority = false }: { icon: ArticleCardIconType; priority?: boolean }) {
  if (icon.type === 'emoji') {
    return <span className="text-5xl">{icon.emoji}</span>;
  }

  return (
    <Image
      src={icon.src}
      alt={icon.alt}
      width={ICON_SIZE}
      height={ICON_SIZE}
      className="h-auto"
      priority={priority}
    />
  );
}

export function ArticleCard({
  date,
  description,
  eyecatch,
  href,
  icon,
  isExternal = false,
  priority = false,
  slug,
  tags,
  title,
  updatedAt,
  onNavigate,
}: ArticleCardProps) {
  const linkProps = getExternalLinkProps(isExternal);
  const showDefaultIcon = !eyecatch?.url && !icon;
  const eyecatchRef = useRef<HTMLDivElement>(null);

  /* 一覧に「戻る」際、直前に見ていた記事のカードだけをモーフィング対象にする。
     全カードに view-transition-name を付けると、対応する旧要素を持たない
     他カードのアイキャッチまで個別の出現アニメーション対象になってしまうため、
     sessionStorage に記録された slug と一致するカードだけ描画時に名前を付ける。 */
  const morphSlug = useEyecatchViewTransitionSlug();
  const viewTransitionName = slug && morphSlug === slug ? `eyecatch-${slug}` : undefined;
  const hasBeenUpdated = Boolean(updatedAt && updatedAt.slice(0, 10) !== date.slice(0, 10));

  /* View Transition は startViewTransition() 呼び出し時点で旧DOMを同期的に
     キャプチャするため、クリックした瞬間に DOM へ直接反映する。React の
     再レンダーを待つと(バッチングにより)キャプチャに間に合わない。 */
  const handleClick = useCallback(() => {
    onNavigate?.();
    if (!slug) {
      return;
    }
    markEyecatchViewTransition(slug);

    const lastMarkedEyecatchElement = lastMarkedEyecatchElementRef?.deref();
    if (lastMarkedEyecatchElement && lastMarkedEyecatchElement !== eyecatchRef.current) {
      lastMarkedEyecatchElement.style.viewTransitionName = '';
    }

    if (eyecatchRef.current) {
      eyecatchRef.current.style.viewTransitionName = `eyecatch-${slug}`;
      lastMarkedEyecatchElementRef = new WeakRef(eyecatchRef.current);
    }
  }, [onNavigate, slug]);

  return (
    <article className="article-card group">
      <Link
        href={href}
        className="absolute inset-0 z-0"
        aria-hidden="true"
        tabIndex={-1}
        onClick={handleClick}
        {...linkProps}
      />

      <div className="relative z-10 flex flex-col">
        <div
          ref={eyecatchRef}
          className="relative aspect-[16/9] overflow-hidden"
          style={viewTransitionName ? ({ viewTransitionName } as CSSProperties) : undefined}
        >
          <CardBackground eyecatch={eyecatch} priority={priority} />
          <div className="absolute inset-0 flex items-center justify-center">
            {icon && <CardIcon icon={icon} priority={priority} />}
            {showDefaultIcon && (
              <Image
                src={DEFAULT_EYECATCH_PATH}
                alt=""
                width={80}
                height={42}
                className="h-auto opacity-30"
                priority={priority}
              />
            )}
          </div>
        </div>

        <div className="article-card-body">
          <div className="relative z-10 flex flex-col gap-3 p-5">
            <Link href={href} onClick={handleClick} {...linkProps} className="block">
              <h2 className="text-base font-semibold leading-snug text-card-foreground line-clamp-2 transition-colors group-hover:text-primary">
                {title}
              </h2>
            </Link>

            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {tags && tags.length > 0 && (
                <div className="relative z-20">
                  <TagList tags={tags} />
                </div>
              )}
              <Time
                date={hasBeenUpdated ? updatedAt! : date}
                label={hasBeenUpdated ? '更新' : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
