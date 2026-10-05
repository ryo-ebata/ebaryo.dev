'use client';

import { IconBrandGithub, IconBrandX } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BackLink } from '@/components/atoms';
import { Card } from '@/components/atoms/card';
import { Separator } from '@/components/atoms/separator';
import { BuyMeACoffee } from '@/components/molecules';
import { Container } from '@/components/organisms/container';
import { siteConfig } from '@/config/site';

const IMAGE_SIZE = 20;

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <div className="space-y-2">
    <h2 className="section-heading font-semibold scroll-m-20 text-lg tracking-tight text-foreground">
      {children}
    </h2>
    <Separator />
  </div>
);

/** ソーシャルURLの末尾セグメントから @ハンドルを得る。 */
const getHandle = (href: string): string => {
  try {
    const segment = new URL(href).pathname.split('/').filter(Boolean).pop();
    return segment ? `@${segment}` : '';
  } catch {
    return '';
  }
};

const SocialChip = ({ icon, href, name }: { icon: ReactNode; href: string; name: string }) => {
  const handle = getHandle(href);
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
    >
      {icon}
      <span className="font-medium">{name}</span>
      {handle && <span className="text-muted-foreground">{handle}</span>}
    </Link>
  );
};

const AboutHeader = () => (
  <div className="page-heading mb-12">
    <p className="text-xs font-semibold tracking-[0.16em] text-primary">Profile / Coordinates</p>
    <h1 className="scroll-m-20 text-4xl font-bold tracking-[-0.035em] text-foreground sm:text-5xl">
      About
    </h1>
    <p className="max-w-2xl text-base text-muted-foreground">自己紹介とソーシャルリンク</p>
  </div>
);

const AboutBlogSection = () => (
  <Card className="geometric-panel gap-0 rounded-none p-6">
    <SectionHeading>About Blog</SectionHeading>
    <div className="mt-4 space-y-4 text-sm text-muted-foreground">
      <p className="leading-7">
        単なる情報（Information）ではなく、
        知識（Knowledge）・意見（Opinion）・気付き（Insight）を書きます。
        技術的な内容も含め、思考のメモなどを残していきます。
      </p>
    </div>
  </Card>
);

const AboutMeDescription = () => (
  <p className="leading-7 whitespace-pre-line">
    {`Software Engineer.
Interests: Generative AI, Rust, etc.
Works: Frontend Engineer, Data Engineering.
Hobbies: Anime, Basketball, Mahjong, Travel, etc.`}
  </p>
);

const AboutMeSection = () => (
  <Card className="geometric-panel gap-0 rounded-none p-6">
    <SectionHeading>About Me</SectionHeading>
    <div className="mt-4 space-y-4 text-sm text-muted-foreground">
      <AboutMeDescription />
    </div>
  </Card>
);

const TwitterIcon = () => <IconBrandX className="h-5 w-5" />;

const GithubIcon = () => <IconBrandGithub className="h-5 w-5" />;

const ZennIcon = () => (
  <Image alt="Zenn" height={IMAGE_SIZE} src="/image/zenn-logo/logo-only.svg" width={IMAGE_SIZE} />
);

const QiitaIcon = () => (
  <Image
    alt="Qiita"
    height={IMAGE_SIZE}
    src="/image/qiita-icon/qiita-icon.png"
    width={IMAGE_SIZE}
  />
);

const socialLinks = [
  { name: 'X', href: siteConfig.links.twitter, icon: <TwitterIcon /> },
  { name: 'GitHub', href: siteConfig.links.github, icon: <GithubIcon /> },
  { name: 'Zenn', href: siteConfig.links.zenn, icon: <ZennIcon /> },
  { name: 'Qiita', href: siteConfig.links.qiita, icon: <QiitaIcon /> },
].filter((social) => Boolean(social.href));

const SocialLinksList = () => (
  <div className="mt-4 flex flex-wrap gap-2">
    {socialLinks.map((social) => (
      <SocialChip key={social.name} href={social.href} icon={social.icon} name={social.name} />
    ))}
  </div>
);

const SocialLinksSection = () => (
  <Card className="geometric-panel gap-0 rounded-none p-6">
    <SectionHeading>Social Links</SectionHeading>
    <SocialLinksList />
  </Card>
);

const AboutContent = () => (
  <div className="space-y-6">
    <AboutBlogSection />
    <AboutMeSection />
    <SocialLinksSection />
    <div className="text-end">
      <BackLink href="/" label="ホームに戻る" />
    </div>
  </div>
);

export const AboutPresenter = () => (
  <Container maxWidth="4xl">
    <div className="space-y-12">
      <AboutHeader />
      <AboutContent />
    </div>
    <BuyMeACoffee />
  </Container>
);
