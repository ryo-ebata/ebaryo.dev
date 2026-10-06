import { buttonVariants } from '@/components/atoms/button';
import { siteConfig } from '@/config/site';

const followLinks = [
  { label: 'X', href: siteConfig.links.twitter },
  { label: 'GitHub', href: siteConfig.links.github },
  { label: 'Zenn', href: siteConfig.links.zenn },
  { label: 'Qiita', href: siteConfig.links.qiita },
].filter((link) => Boolean(link.href));

const initial = siteConfig.author.name.charAt(0).toUpperCase();

/**
 * 記事末尾の著者バイオボックス(E-E-A-T / フォロー導線)。
 * フォローリンクには rel="me" を付与し本人確認可能にする。
 */
export const AuthorBio = () => (
  <section className="not-prose overflow-hidden rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10">
    <div className="flex items-start gap-4">
      {siteConfig.author.avatar ? (
        // 任意パスのプロフィール画像。外部最適化を避けるため img を使用
        // oxlint-disable-next-line
        <img
          src={siteConfig.author.avatar}
          alt={siteConfig.author.name}
          className="size-14 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">書いた人</p>
        <p className="text-base font-semibold text-foreground">{siteConfig.author.name}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{siteConfig.author.bio}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {followLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="me noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
);
