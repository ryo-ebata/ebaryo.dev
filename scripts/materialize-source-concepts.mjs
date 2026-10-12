#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

const VAULT_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog'
);
const NOTES_ROOT = path.join(VAULT_ROOT, 'private', 'notes');
const WRITE_FLAG = '--write';

const CLIP_TECH_DEBT = '技術的負債の変質について';
const CLIP_ZETTELKASTEN =
  '天才社会学者がやっていた。大量アウトプットを可能にする驚異のメモ術「ツェッテルカステン」って知ってる？';
const KINDLE_QUESTIONS =
  '問いかけの作法 チームの魅力と才能を引き出す技術【DL特典付き（未収録原稿）】';
const KINDLE_PRODUCT =
  '正しいものを正しくつくる　プロダクトをつくるとはどういうことなのか、あるいはアジャイルのその先について';

const concepts = [
  {
    title: '技術的負債は理解とコードの乖離である',
    body: '技術的負債とは、単なる汚いコードではない。リリース後に得た学びと、その学びをまだ反映していないコードの差である。学びによって設計上の理解が変わる限り、負債は意図せず生まれる。',
    tags: ['topic/software-development', 'topic/technical-debt'],
    source: ['clipping', CLIP_TECH_DEBT],
  },
  {
    title: '技術的負債の利子は生産性低下として支払う',
    body: '技術的負債を放置すると、古い理解に合わせて変更する余計な作業が繰り返し発生する。この継続的な生産性低下が負債の利子であり、元本の大きさより先に観測すべき兆候である。',
    tags: ['topic/software-development', 'topic/technical-debt'],
    source: ['clipping', CLIP_TECH_DEBT],
  },
  {
    title: '技術的負債は組織構造からも生まれる',
    body: '技術的負債はコードだけの問題ではない。責任分界や意思決定、チーム間の関係が不適切なら、その構造がシステムへ転写される。負債の返済には、[[コンウェイの法則]]を踏まえた組織側の変更も必要になる。',
    tags: ['topic/software-development', 'topic/team-design', 'topic/technical-debt'],
    maps: ['[[チーム設計]]'],
    source: ['clipping', CLIP_TECH_DEBT],
  },
  {
    title: '技術的負債は解決ではなく管理し続ける',
    body: '学習や環境変化が続く限り、技術的負債をゼロのまま固定できない。負債を一度きりの解消案件にせず、発見・評価・返済を開発の継続的な活動として扱う。',
    tags: ['topic/software-development', 'topic/technical-debt'],
    source: ['clipping', CLIP_TECH_DEBT],
  },
  {
    title: '原子ノートは単独で意味を持つ',
    body: '原子ノートは、一つの主張だけを扱い、元資料を開かなくても意味が通じる形で書く。引用の断片ではなく、自分の言葉で主張と理由を残すことで、別の文脈から再利用できる。',
    tags: ['topic/knowledge-management', 'topic/writing'],
    source: ['clipping', CLIP_ZETTELKASTEN],
  },
  {
    title: 'ノートのリンクには理由を添える',
    body: 'ノート同士をつなぐときは、リンクだけでなく関係の理由も書く。類似・対立・具体例・因果などの意味を添えると、後からリンクをたどったときに思考の文脈を復元できる。',
    tags: ['topic/knowledge-management', 'topic/writing'],
    source: ['clipping', CLIP_ZETTELKASTEN],
  },
  {
    title: '孤立ノートを作らない',
    body: '新しいノートは、既存の知識と少なくとも一つの関係を持たせる。保存時に接続先を考える行為そのものが理解を深め、ノートを検索対象から思考のネットワークへ変える。',
    tags: ['topic/knowledge-management', 'topic/writing'],
    source: ['clipping', CLIP_ZETTELKASTEN],
  },
  {
    title: '孤軍奮闘の悪循環',
    body: '一人で問題を抱えて成果を出そうとするほど、周囲に問いかける余裕がなくなり、さらに仕事が集中する。個人の能力不足ではなく、他者の力を引き出せない相互作用の問題として扱う。',
    tags: ['topic/team-design', 'topic/leadership'],
    maps: ['[[チーム設計]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-40002'],
  },
  {
    title: '問いかけは他力を引き出す',
    body: 'よい問いかけは、答えを回収するためだけのものではない。相手の視点・経験・意欲を引き出し、当事者同士で問題を捉え直す共同作業を生む。',
    tags: ['topic/team-design', 'topic/communication'],
    maps: ['[[チーム設計]]', '[[多様性と協働]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-52356'],
  },
  {
    title: 'ファクトリー型組織',
    body: 'ファクトリー型組織は、上位者が決めた目標と手順を、役割分担によって正確かつ効率的に実行する。再現性には強いが、現場で問いを立てる余地が小さく、未知の問題への適応を阻みやすい。',
    tags: ['topic/team-design', 'topic/organization'],
    maps: ['[[チーム設計]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-35799'],
  },
  {
    title: 'ワークショップ型組織',
    body: 'ワークショップ型組織は、メンバーが対話を通じて目的と進め方を更新しながら協働する。正解が見えない状況で、各人の衝動や専門性を組み合わせて学習を進める。',
    tags: ['topic/team-design', 'topic/organization'],
    maps: ['[[チーム設計]]', '[[多様性と協働]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-28174'],
  },
  {
    title: '判断の自動化は固定観念になる',
    body: '経験から作られた判断基準は、素早い意思決定を助ける一方で、状況が変わっても無意識に適用される。かつて有効だった判断の自動化が、現在の選択肢を狭める固定観念になる。',
    tags: ['topic/decision-making', 'topic/learning'],
    maps: ['[[学習と変化]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-26550'],
  },
  {
    title: 'とらわれを問い直す',
    body: '対話では、結論を急ぐ前に、自分たちが当然だとみなしている前提を言葉にする。その前提が今も有効かを問い直すことで、固定された問題設定から抜け出せる。',
    tags: ['topic/communication', 'topic/learning'],
    maps: ['[[学習と変化]]', '[[多様性と協働]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-56876'],
  },
  {
    title: '議論と対話の違い',
    body: '議論は、選択肢を比較して結論を決める収束の活動である。対話は、互いの前提や意味付けを持ち寄り、問題の捉え方そのものを広げる探索の活動である。目的に応じて使い分ける。',
    tags: ['topic/communication', 'topic/team-design'],
    maps: ['[[多様性と協働]]'],
    source: ['kindle', KINDLE_QUESTIONS, 'ref-26467'],
  },
  {
    title: 'アジャイルは作ることを通じて学ぶ',
    body: 'アジャイル開発の中心は、決めた計画を高速に消化することではない。実際に作ったものを観察し、顧客とチームが学び、次の判断を更新する短い循環にある。',
    tags: ['topic/agile', 'topic/product-development'],
    maps: ['[[学習と変化]]', '[[不確実性と情報]]'],
    source: ['kindle', KINDLE_PRODUCT],
  },
  {
    title: 'インクリメンタルとイテレーティブ',
    body: 'インクリメンタルは、完成範囲を少しずつ足す進め方である。イテレーティブは、同じ対象を繰り返し見直して理解と品質を高める進め方である。不確実な開発では両方を組み合わせる。',
    aliases: ['漸進型と反復型'],
    tags: ['topic/agile', 'topic/product-development'],
    maps: ['[[不確実性と情報]]'],
    source: ['kindle', KINDLE_PRODUCT],
  },
  {
    title: '要求と要件の違い',
    body: '要求は、関係者が実現したい価値や必要性を表す。要件は、その要求を満たすためにプロダクトが備える条件へ具体化したものである。要求を一つの要件へ早期に固定すると、よりよい解決策を失う。',
    tags: ['topic/product-development', 'topic/requirements'],
    maps: ['[[要求]]'],
    source: ['kindle', KINDLE_PRODUCT],
  },
  {
    title: '小さな合意形成を反復する',
    body: '不確実な開発では、最初に大きな合意を完成させるより、作る範囲を小さく区切って合意と検証を繰り返す。誤りを早く発見し、学びを次の判断へ反映できる。',
    tags: ['topic/agile', 'topic/decision-making'],
    maps: ['[[不確実性と情報]]'],
    source: ['kindle', KINDLE_PRODUCT],
  },
];

const normalize = (value) => value.normalize('NFC').trim().toLocaleLowerCase('ja-JP');
const yamlString = (value) => JSON.stringify(value);
const wikilink = ([kind, title, block]) => {
  const directory = kind === 'kindle' ? 'kindle' : 'clipping';
  return `[[../${directory}/${title}${block ? `#^${block}` : ''}]]`;
};
const frontmatterSource = ([kind, title]) => `[[private/${kind}/${title}]]`;

const renderList = (name, values) =>
  values?.length
    ? `${name}:\n${values.map((value) => `  - ${yamlString(value)}`).join('\n')}\n`
    : '';

const renderNote = ({ aliases, body, maps, source, tags }) => `---
type: note
${renderList('aliases', aliases)}${renderList('tags', tags)}status: seed
${renderList('maps', maps)}${renderList('sources', [frontmatterSource(source)])}---
${body}

## 出典

- ${wikilink(source)}
`;

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const collectExistingNames = async () => {
  const entries = await readdir(NOTES_ROOT, { withFileTypes: true });
  const names = new Set();
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name) !== '.md') continue;
    names.add(normalize(path.basename(entry.name, '.md')));
    const raw = await readFile(path.join(NOTES_ROOT, entry.name), 'utf8');
    const aliases = matter(raw).data.aliases;
    for (const alias of Array.isArray(aliases) ? aliases : aliases ? [aliases] : []) {
      if (typeof alias === 'string') names.add(normalize(alias));
    }
  }
  return names;
};

const assertSourcesExist = async () => {
  const missing = [];
  for (const concept of concepts) {
    const [kind, title] = concept.source;
    const sourcePath = path.join(VAULT_ROOT, 'private', kind, `${title}.md`);
    if (!(await exists(sourcePath))) missing.push(sourcePath);
  }
  if (missing.length) throw new Error(`出典ファイルが見つかりません:\n${missing.join('\n')}`);
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  await assertSourcesExist();
  const existingNames = await collectExistingNames();
  const creates = [];
  const skips = [];

  for (const concept of concepts) {
    const keys = [concept.title, ...(concept.aliases ?? [])].map(normalize);
    if (keys.some((key) => existingNames.has(key))) {
      skips.push(concept.title);
      continue;
    }
    const filePath = path.join(NOTES_ROOT, `${concept.title}.md`);
    creates.push({ content: renderNote(concept), filePath, title: concept.title });
    keys.forEach((key) => existingNames.add(key));
  }

  console.log(
    JSON.stringify(
      {
        creates: creates.map(({ title }) => title),
        mode: write ? 'write' : 'dry-run',
        skips,
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(creates.map(({ content, filePath }) => writeFile(filePath, content, 'utf8')));
  console.log(`[materialize-source-concepts] 原子ノート${creates.length}件を作成した`);
};

main().catch((error) => {
  console.error('[materialize-source-concepts] 失敗:', error.message);
  process.exitCode = 1;
});
