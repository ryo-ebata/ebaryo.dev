export type WriterReadabilityLevel = 'blocker' | 'hint' | 'warning';

export interface WriterReadabilityFinding {
  category: 'choice' | 'clarity' | 'link' | 'media' | 'structure';
  level: WriterReadabilityLevel;
  offset: number;
  suggestion: string;
  text: string;
}

export interface WriterReadabilityAnalysis {
  blockers: WriterReadabilityFinding[];
  findings: WriterReadabilityFinding[];
  hints: WriterReadabilityFinding[];
  score: number;
  warnings: WriterReadabilityFinding[];
}

interface TextBlock {
  offset: number;
  text: string;
}

const LONG_PARAGRAPH_LENGTH = 300;
const MAX_VISIBLE_CHOICES = 10;
const MIN_ARTICLE_LENGTH_FOR_INTRO_CHECK = 600;
const VAGUE_HEADINGS = new Set(['概要', '詳細', 'その他', '情報', '内容', '補足']);

const stripMarkdown = (value: string) =>
  value
    .replace(/<!--[^]*?-->/gu, '')
    .replace(/```[^]*?```/gu, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, '$2 $1')
    .replace(/[*_~`#]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();

const collectParagraphs = (body: string): TextBlock[] => {
  const paragraphs: TextBlock[] = [];
  const lines = body.split('\n');
  let current: string[] = [];
  let currentOffset = 0;
  let inCodeBlock = false;
  let offset = 0;
  const finish = () => {
    const text = stripMarkdown(current.join(' '));
    if (text) paragraphs.push({ offset: currentOffset, text });
    current = [];
  };

  for (const line of lines) {
    if (/^\s*```/u.test(line)) {
      finish();
      inCodeBlock = !inCodeBlock;
    } else if (
      !inCodeBlock &&
      (!line.trim() || /^#{1,6}\s/u.test(line) || /^\s*(?:[-*>]|\d+\.)\s/u.test(line))
    ) {
      finish();
    } else if (!inCodeBlock) {
      if (current.length === 0) currentOffset = offset;
      current.push(line.trim());
    }
    offset += line.length + 1;
  }
  finish();
  return paragraphs;
};

const collectListRuns = (body: string): TextBlock[] => {
  const runs: TextBlock[] = [];
  const lines = body.split('\n');
  let count = 0;
  let start = 0;
  let offset = 0;
  const finish = () => {
    if (count > MAX_VISIBLE_CHOICES) runs.push({ offset: start, text: `${count}項目のリスト` });
    count = 0;
  };
  for (const line of lines) {
    if (/^\s*(?:[-*+] |\d+\. )/u.test(line)) {
      if (count === 0) start = offset;
      count += 1;
    } else finish();
    offset += line.length + 1;
  }
  finish();
  return runs;
};

const push = (
  findings: WriterReadabilityFinding[],
  finding: WriterReadabilityFinding | null | undefined
) => {
  if (finding) findings.push(finding);
};

export const analyzeWriterReadability = (body: string): WriterReadabilityAnalysis => {
  const findings: WriterReadabilityFinding[] = [];
  const proseBody = body.replace(/```[^]*?```/gu, (code) => ' '.repeat(code.length));
  const headings = [...proseBody.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gmu)].map((match) => ({
    level: match[1].length,
    offset: match.index ?? 0,
    text: match[2].trim(),
  }));
  const paragraphs = collectParagraphs(body);

  const firstHeading = headings[0];
  if (firstHeading && firstHeading.level > 2) {
    findings.push({
      category: 'structure',
      level: 'blocker',
      offset: firstHeading.offset,
      suggestion: '最初の章をH2にし、下位の内容をH3以降に置く',
      text: `最初の見出し「${firstHeading.text}」がH${firstHeading.level}から始まっている`,
    });
  }

  const bodyH1 = headings.find((heading) => heading.level === 1);
  push(
    findings,
    bodyH1 && {
      category: 'structure',
      level: 'blocker',
      offset: bodyH1.offset,
      suggestion: '記事タイトルをH1として使うため、本文はH2から始める',
      text: `本文内のH1「${bodyH1.text}」を削除する`,
    }
  );

  for (let index = 1; index < headings.length; index += 1) {
    const heading = headings[index];
    if (heading.level <= headings[index - 1].level + 1) continue;
    findings.push({
      category: 'structure',
      level: 'blocker',
      offset: heading.offset,
      suggestion: `H${headings[index - 1].level + 1}を挟み、親子関係を明示する`,
      text: `「${heading.text}」の見出しレベルが飛んでいる`,
    });
  }

  const imageWithoutAlt = /!\[\s*\]\([^)]+\)/u.exec(proseBody);
  push(
    findings,
    imageWithoutAlt && {
      category: 'media',
      level: 'blocker',
      offset: imageWithoutAlt.index,
      suggestion: '画像が伝える情報を短い代替テキストにする。装飾画像なら本文側で役割を見直す',
      text: '説明のない画像がある',
    }
  );

  const emptyLink = /(?<!!)\[\s*\]\([^)]+\)/u.exec(proseBody);
  push(
    findings,
    emptyLink && {
      category: 'link',
      level: 'blocker',
      offset: emptyLink.index,
      suggestion: 'リンク先を予測できる名前を付ける',
      text: '名前のないリンクがある',
    }
  );

  for (const paragraph of paragraphs.filter(({ text }) => text.length > LONG_PARAGRAPH_LENGTH)) {
    findings.push({
      category: 'clarity',
      level: 'warning',
      offset: paragraph.offset,
      suggestion: '主張・理由・具体例の境界で段落を分ける',
      text: `${paragraph.text.length}文字の段落を分割する`,
    });
  }

  for (const heading of headings.filter(({ text }) => VAGUE_HEADINGS.has(text))) {
    findings.push({
      category: 'clarity',
      level: 'warning',
      offset: heading.offset,
      suggestion: '読者が内容を予測できる具体的な見出しにする',
      text: `見出し「${heading.text}」が抽象的すぎる`,
    });
  }

  for (const match of proseBody.matchAll(/(?<!!)\[([^\]]+)\]\([^)]+\)/gu)) {
    if (!/^(?:こちら|ここ|詳細|リンク)$/u.test(match[1].trim())) continue;
    findings.push({
      category: 'link',
      level: 'warning',
      offset: match.index ?? 0,
      suggestion: 'リンク先の文書名か、移動後に得られる情報を書く',
      text: `リンク名「${match[1]}」だけでは移動先が分からない`,
    });
  }

  for (const list of collectListRuns(proseBody)) {
    findings.push({
      category: 'choice',
      level: 'warning',
      offset: list.offset,
      suggestion: '分類見出しで分割するか、重要な項目を先に絞る',
      text: `${list.text}を一度に見せすぎている`,
    });
  }

  const plainLength = stripMarkdown(body).replace(/\s/gu, '').length;
  const firstHeadingOffset = headings.find((heading) => heading.level >= 2)?.offset ?? body.length;
  const introduction = stripMarkdown(body.slice(0, firstHeadingOffset));
  if (
    plainLength >= MIN_ARTICLE_LENGTH_FOR_INTRO_CHECK &&
    !/(?:この記事|本記事|対象|悩|課題|問題|方法|できる|解説|紹介|目的|なぜ)/u.test(introduction)
  ) {
    findings.push({
      category: 'clarity',
      level: 'hint',
      offset: 0,
      suggestion: '対象読者・困りごと・読み終えた後にできることのいずれかを冒頭に置く',
      text: '冒頭から記事の対象と効用を読み取りにくい',
    });
  }

  for (const paragraph of paragraphs) {
    if (!/^(?:これ|それ|このこと|そのこと|上記)(?:は|が|を|に|で|の)/u.test(paragraph.text))
      continue;
    findings.push({
      category: 'clarity',
      level: 'hint',
      offset: paragraph.offset,
      suggestion: '何を指すか名詞で書き直す',
      text: `段落冒頭の「${paragraph.text.slice(0, 6)}…」が曖昧に見える`,
    });
  }

  const blockers = findings.filter(({ level }) => level === 'blocker');
  const warnings = findings.filter(({ level }) => level === 'warning');
  const hints = findings.filter(({ level }) => level === 'hint');
  const score = Math.max(0, 100 - blockers.length * 25 - warnings.length * 10 - hints.length * 3);
  return { blockers, findings, hints, score, warnings };
};
