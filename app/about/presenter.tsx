import { IconBrandGithub, IconBrandX } from '@tabler/icons-react';
import { ArrowUpRight, Braces, Database, PenLine, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BuyMeACoffee } from '@/components/molecules';
import { Container } from '@/components/organisms/container';
import { siteConfig } from '@/config/site';
import styles from './about.module.css';

const IMAGE_SIZE = 22;

const ProfileDiagram = () => (
  <div className={styles.diagram} aria-hidden="true">
    <svg viewBox="0 0 520 520" role="presentation">
      <rect className={styles.sheetFrame} x="32" y="32" width="456" height="456" />
      <path className={styles.dimension} d="M58 54h404M58 47v14M462 47v14" />
      <path className={styles.dimension} d="M466 72v376M459 72h14M459 448h14" />
      <path className={styles.stratum} d="M42 92h105l31-24h118l28 24h154" />
      <path className={styles.stratum} d="M42 174h76l35 23h126l32-23h167" />
      <path className={styles.stratum} d="M42 282h142l31-27h109l38 27h116" />
      <path className={styles.stratum} d="M42 398h92l36 24h168l31-24h109" />
      <path className={styles.route} d="M118 92v82l142 108v116h109" />
      <path className={styles.routeGhost} d="M118 92 260 174v108l109 116" />
      <rect className={styles.marker} x="105" y="79" width="26" height="26" />
      <circle className={styles.marker} cx="118" cy="174" r="13" />
      <path className={styles.marker} d="m260 264 18 18-18 18-18-18 18-18Z" />
      <path className={styles.marker} d="m369 380 18 10v16l-18 10-18-10v-16l18-10Z" />
      <rect className={styles.nameplate} x="185" y="201" width="150" height="76" />
      <text className={styles.monogram} x="260" y="249" textAnchor="middle">
        ebaryo
      </text>
      <text x="42" y="73">
        ROUGH PLAN / IMPLEMENTATION
      </text>
      <text x="42" y="155">
        DATA FLOW
      </text>
      <text x="42" y="263">
        WRITING
      </text>
      <text x="42" y="379">
        OPEN SOURCE
      </text>
      <text className={styles.coordinateText} x="438" y="470" textAnchor="end">
        WORKING DRAWING / REV. 06
      </text>
      <text className={styles.dimensionText} x="260" y="51" textAnchor="middle">
        456
      </text>
      <text className={styles.dimensionText} x="473" y="260" textAnchor="middle">
        FIELD NOTES
      </text>
    </svg>
  </div>
);

const AboutHero = () => (
  <header className={styles.hero}>
    <div className={styles.heroCopy}>
      <p className={styles.kicker}>About me</p>
      <h1>
        <span>Webエンジニアを</span>
        <span>やっています。</span>
      </h1>
      <p className={styles.lead}>
        フロントエンドとデータ基盤の仕事をしている。最近は生成AIやRustもよく触る。
        このサイトには、作ったものと、開発中に調べたことや考えたことを置いている。
      </p>
      <div className={styles.heroLinks}>
        <Link className={styles.primaryLink} href="/portfolio">
          作ったものを見る
          <ArrowUpRight aria-hidden="true" />
        </Link>
        <Link className={styles.textLink} href="/blog">
          記事を読む
        </Link>
      </div>
    </div>
    <ProfileDiagram />
  </header>
);

const principles = [
  {
    icon: <Braces aria-hidden="true" />,
    title: 'Build',
    text: 'フロントエンドを中心に、実際に使いやすいものを作る。',
  },
  {
    icon: <Database aria-hidden="true" />,
    title: 'Connect',
    text: '散らばったデータを、使える状態までつなぐ。',
  },
  {
    icon: <Sparkles aria-hidden="true" />,
    title: 'Explore',
    text: '生成AIやRustなど、気になった技術を実際に試す。',
  },
  {
    icon: <PenLine aria-hidden="true" />,
    title: 'Write',
    text: '調べたことだけでなく、自分がどう考えたかまで書く。',
  },
] as const;

const CoordinatesSection = () => (
  <section className={styles.coordinates} aria-labelledby="coordinates-heading">
    <div className={styles.sectionIntro}>
      <div>
        <p>What I do</p>
        <h2 id="coordinates-heading">よくやっていること</h2>
      </div>
    </div>
    <div className={styles.coordinateGrid}>
      {principles.map((item, index) => (
        <article className={styles.coordinate} key={item.title}>
          <div className={styles.coordinateIndex}>{String(index + 1).padStart(2, '0')}</div>
          <div className={styles.coordinateIcon}>{item.icon}</div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  </section>
);

const JournalSection = () => (
  <section className={styles.journal} aria-labelledby="journal-heading">
    <div className={styles.journalStatement}>
      <p className={styles.sectionLabel}>About this site</p>
      <h2 id="journal-heading">調べたことと、考えたことを書く。</h2>
    </div>
    <div className={styles.journalBody}>
      <p>
        手順だけなら公式ドキュメントや検索結果で足りる。ここでは、なぜその方法を選んだのか、どこで失敗したのかも書く。
      </p>
      <p>
        あとで自分が読み返して使えることを優先している。同じところで困った人にも役立てばうれしい。
      </p>
    </div>
  </section>
);

const socialLinks: { href: string; icon: ReactNode; name: string }[] = [
  { name: 'GitHub', href: siteConfig.links.github, icon: <IconBrandGithub aria-hidden="true" /> },
  { name: 'X', href: siteConfig.links.twitter, icon: <IconBrandX aria-hidden="true" /> },
  {
    name: 'Zenn',
    href: siteConfig.links.zenn,
    icon: (
      <Image alt="" height={IMAGE_SIZE} src="/image/zenn-logo/logo-only.svg" width={IMAGE_SIZE} />
    ),
  },
  {
    name: 'Qiita',
    href: siteConfig.links.qiita,
    icon: (
      <Image alt="" height={IMAGE_SIZE} src="/image/qiita-icon/qiita-icon.png" width={IMAGE_SIZE} />
    ),
  },
].filter((social) => Boolean(social.href));

const SocialSection = () => (
  <section className={styles.social} aria-labelledby="social-heading">
    <div>
      <p className={styles.sectionLabel}>Links</p>
      <h2 id="social-heading">ほかのアカウント</h2>
    </div>
    <div className={styles.socialLinks}>
      {socialLinks.map((social) => (
        <Link
          className={styles.socialLink}
          href={social.href}
          key={social.name}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>{social.icon}</span>
          {social.name}
          <ArrowUpRight aria-hidden="true" />
        </Link>
      ))}
    </div>
  </section>
);

export const AboutPresenter = () => (
  <Container maxWidth="6xl">
    <div className={styles.about}>
      <AboutHero />
      <JournalSection />
      <CoordinatesSection />
      <SocialSection />
    </div>
    <BuyMeACoffee />
  </Container>
);
