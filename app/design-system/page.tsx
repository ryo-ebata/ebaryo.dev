import type { Metadata } from 'next';
import { ArrowUpRight, Check, Copy, Diamond, Info, TriangleAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms';
import { Container } from '@/components/organisms';
import { componentCategories, componentRegistry } from '@/lib/design-system/component-registry';
import styles from './design-system.module.css';

export const metadata: Metadata = {
  description: 'ebaryo.devで使われているデザイントークン、UIコンポーネント、表現原則',
  title: 'Design System',
};

const colors = [
  { name: 'Canvas', token: '--background', role: 'ページの基底面' },
  { name: 'Ink', token: '--foreground', role: '本文と構造線' },
  { name: 'Signal', token: '--primary', role: '操作と強調' },
  { name: 'Surface', token: '--card', role: '浮いた情報面' },
  { name: 'Quiet', token: '--muted', role: '補助領域' },
  { name: 'Coordinate', token: '--geometry-secondary', role: '幾何学的な補助色' },
] as const;

const SectionHeading = ({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) => (
  <div className={styles.sectionHeading}>
    <span>{index}</span>
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  </div>
);

const Hero = () => (
  <header className={styles.hero}>
    <div className={styles.heroCopy}>
      <p className={styles.kicker}>ebaryo.dev / visual language</p>
      <h1>
        このサイトで使う
        <br />
        デザインのルール。
      </h1>
      <p>
        色、文字、余白、コンポーネントをまとめている。実際にサイトで使っているものだけを載せる。
      </p>
      <div className={styles.version}>
        <span>Current</span>
        <strong>System 01</strong>
        <span>2026.10</span>
      </div>
    </div>
    <div className={styles.heroGeometry} aria-hidden="true">
      <div className={styles.geometryFrame}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={styles.geometryCore}>
        <span>E</span>
      </div>
      <p>WRITE · BUILD · CONNECT</p>
    </div>
  </header>
);

const Foundations = () => (
  <section className={styles.section} id="foundations">
    <SectionHeading index="01" title="Foundations" description="色、文字、図形の基本ルール。" />
    <div className={styles.foundationGrid}>
      <article className={styles.catalogPanel}>
        <div className={styles.panelHeading}>
          <h3>Color</h3>
          <code>semantic tokens</code>
        </div>
        <div className={styles.colorGrid}>
          {colors.map((color) => (
            <div className={styles.colorItem} key={color.token}>
              <span className={styles.swatch} style={{ background: `var(${color.token})` }} />
              <strong>{color.name}</strong>
              <code>{color.token}</code>
              <small>{color.role}</small>
            </div>
          ))}
        </div>
      </article>
      <article className={styles.catalogPanel}>
        <div className={styles.panelHeading}>
          <h3>Type</h3>
          <code>Noto Sans JP</code>
        </div>
        <div className={styles.typeScale}>
          <div>
            <span>Display / 64</span>
            <p className={styles.typeDisplay}>作って、試して、書く。</p>
          </div>
          <div>
            <span>Heading / 32</span>
            <p className={styles.typeHeading}>最近書いた記事</p>
          </div>
          <div>
            <span>Body / 16</span>
            <p className={styles.typeBody}>長い記事でも読みやすい文字サイズと行間にする。</p>
          </div>
          <div>
            <span>Label / 12</span>
            <p className={styles.typeLabel}>SYSTEM COORDINATES</p>
          </div>
        </div>
      </article>
    </div>
    <article className={styles.geometryRules}>
      <div>
        <Diamond aria-hidden="true" />
        <strong>Diamond</strong>
        <p>注目してほしい場所に使う。</p>
      </div>
      <div>
        <span className={styles.ruleLine} />
        <strong>Line</strong>
        <p>要素の区切りやつながりに使う。</p>
      </div>
      <div>
        <span className={styles.ruleGrid} />
        <strong>Grid</strong>
        <p>要素を揃えて並べる。</p>
      </div>
      <div>
        <span className={styles.ruleCut} />
        <strong>Cut</strong>
        <p>面に変化をつける。</p>
      </div>
    </article>
  </section>
);

const principles = [
  {
    title: 'Hierarchy',
    text: '大きさ、太さ、余白を使い、最初に読むものを一つに絞る。すべてを強調しない。',
  },
  { title: 'Proximity', text: '意味の近い情報は近づけ、異なる話題は余白と罫線で明確に分ける。' },
  {
    title: 'Consistency',
    text: '同じ役割には同じトークンと挙動を使う。色が似ているだけの値を選ばない。',
  },
  {
    title: 'Readability',
    text: '長文は16px以上、行長は75文字以内を基準とし、本文の読みやすさを装飾より優先する。',
  },
  {
    title: 'Accessibility',
    text: '通常文字4.5:1、UIと大文字3:1、操作対象24px以上を最低条件とする。',
  },
  {
    title: 'Motion with purpose',
    text: '動きは関係・状態・結果を説明する時だけ使い、動きを減らす設定を必ず尊重する。',
  },
] as const;

const Principles = () => (
  <section className={styles.section} id="principles">
    <SectionHeading index="02" title="Principles" description="実装で迷った時に確認すること。" />
    <div className={styles.principleGrid}>
      {principles.map((principle, index) => (
        <article key={principle.title}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <h3>{principle.title}</h3>
          <p>{principle.text}</p>
        </article>
      ))}
    </div>
    <div className={styles.standardBar}>
      <strong>Baseline</strong>
      <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noreferrer">
        WCAG 2.2 AA
        <ArrowUpRight />
      </a>
      <span>Focus 3px</span>
      <span>Target ≥ 24px</span>
      <span>Body ≥ 16px</span>
      <span>Line ≤ 75字</span>
    </div>
  </section>
);

const Components = () => (
  <section className={styles.section} id="components">
    <SectionHeading
      index="03"
      title="Components"
      description="このサイトで実際に使っている部品。"
    />
    <div className={styles.componentGrid}>
      <article className={styles.catalogPanel}>
        <div className={styles.panelHeading}>
          <h3>Actions</h3>
          <code>Button</code>
        </div>
        <div className={styles.previewRow}>
          <Button>公開する</Button>
          <Button variant="secondary">下書き保存</Button>
          <Button variant="outline">プレビュー</Button>
          <Button variant="ghost">閉じる</Button>
          <Button variant="destructive">削除</Button>
        </div>
        <Separator />
        <div className={styles.previewRow}>
          <Button size="sm">
            <Check />
            完了
          </Button>
          <Button size="icon" variant="outline" aria-label="コピー">
            <Copy />
          </Button>
          <Button disabled>利用不可</Button>
        </div>
      </article>
      <article className={styles.catalogPanel}>
        <div className={styles.panelHeading}>
          <h3>Status</h3>
          <code>Badge</code>
        </div>
        <div className={styles.previewRow}>
          <Badge>Primary</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Published</Badge>
          <Badge variant="warning">Review</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="destructive">Error</Badge>
        </div>
      </article>
      <article className={styles.catalogPanel}>
        <div className={styles.panelHeading}>
          <h3>Input</h3>
          <code>Field states</code>
        </div>
        <div className={styles.inputGrid}>
          <label>
            Default
            <Input placeholder="記事タイトルを入力" />
          </label>
          <label>
            Filled
            <Input defaultValue="デザインシステムを公開する" />
          </label>
          <label>
            Invalid
            <Input aria-invalid="true" defaultValue="不正な入力" />
          </label>
          <label>
            Disabled
            <Input disabled placeholder="編集できない項目" />
          </label>
        </div>
      </article>
      <article className={styles.catalogPanel}>
        <div className={styles.panelHeading}>
          <h3>Feedback</h3>
          <code>semantic color</code>
        </div>
        <div className={styles.feedbackList}>
          <div data-tone="success">
            <Check />
            <span>
              <strong>公開完了</strong>記事を公開した。
            </span>
          </div>
          <div data-tone="info">
            <Info />
            <span>
              <strong>補足情報</strong>変更は自動保存される。
            </span>
          </div>
          <div data-tone="warning">
            <TriangleAlert />
            <span>
              <strong>確認が必要</strong>概要文が未入力だ。
            </span>
          </div>
        </div>
      </article>
    </div>
  </section>
);

const Patterns = () => (
  <section className={styles.section} id="patterns">
    <SectionHeading
      index="04"
      title="Patterns"
      description="部品を画面の中でどう組み合わせるか。"
    />
    <div className={styles.patternGrid}>
      <Card className={styles.sampleCard}>
        <CardHeader>
          <Badge variant="info">Design</Badge>
          <CardTitle>読みやすい順番で並べる</CardTitle>
          <CardDescription>
            カードには、ひとまとまりの情報と次にできる操作を入れる。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.miniGeometry}>
            <span />
            <span />
            <span />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">
            詳しく見る
            <ArrowUpRight />
          </Button>
        </CardFooter>
      </Card>
      <div className={styles.tablePattern}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layer</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Foundations</TableCell>
              <TableCell>色や文字の基本ルール</TableCell>
              <TableCell>
                <Badge variant="success">Stable</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Components</TableCell>
              <TableCell>繰り返し使うUI部品</TableCell>
              <TableCell>
                <Badge variant="success">Stable</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Patterns</TableCell>
              <TableCell>部品の組み合わせ方</TableCell>
              <TableCell>
                <Badge variant="warning">Evolving</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </section>
);

const Inventory = () => (
  <section className={styles.section} id="inventory">
    <SectionHeading index="05" title="Inventory" description="登録されている部品の一覧。" />
    <div className="grid gap-10">
      {componentCategories.map((category) => {
        const components = componentRegistry.filter((component) => component.category === category);
        return (
          <article className="grid gap-4" key={category}>
            <div className="flex items-end justify-between border-b border-[var(--system-rule)] pb-3">
              <h3 className="text-xl font-bold">{category}</h3>
              <span className="font-mono text-xs text-primary">
                {String(components.length).padStart(2, '0')} components
              </span>
            </div>
            <ul className="grid list-none grid-cols-1 gap-px overflow-hidden border border-[var(--system-rule)] bg-[var(--system-rule)] p-0 sm:grid-cols-2 xl:grid-cols-3">
              {components.map((component) => (
                <li
                  className="group flex min-h-36 flex-col justify-between gap-5 bg-background p-4 transition-colors hover:bg-accent/45"
                  key={component.name}
                >
                  <div className="min-w-0">
                    <code className="block overflow-hidden text-sm font-bold text-ellipsis text-foreground">
                      {component.name}
                    </code>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {component.purpose}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <small className="text-[0.65rem] leading-normal text-primary">
                      {component.states}
                    </small>
                    <Badge variant="success">Production</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  </section>
);

export default function DesignSystemPage() {
  return (
    <Container maxWidth="6xl">
      <main className={styles.system}>
        <Hero />
        <nav className={styles.localNav} aria-label="デザインシステム内">
          <a href="#foundations">01 Foundations</a>
          <a href="#principles">02 Principles</a>
          <a href="#components">03 Components</a>
          <a href="#patterns">04 Patterns</a>
          <a href="#inventory">05 Inventory</a>
        </nav>
        <Foundations />
        <Principles />
        <Components />
        <Patterns />
        <Inventory />
        <footer className={styles.systemFooter}>
          <span>ebaryo.dev Design System</span>
          <span>Built from production components</span>
        </footer>
      </main>
    </Container>
  );
}
