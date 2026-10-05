import { getReadingTimeMinutes } from './reading-time';

export interface WriterHeading {
  level: number;
  offset: number;
  text: string;
}

export interface WriterFinding {
  offset?: number;
  text: string;
  type: 'good' | 'improve';
}

export interface WriterAnalysis {
  brokenInternalLinks: Array<{ offset: number; url: string }>;
  externalLinks: number;
  findings: WriterFinding[];
  headings: WriterHeading[];
  images: number;
  internalLinks: number;
  paragraphCount: number;
  readingMinutes: number;
}

export interface WriterArticleReference {
  description: string;
  draft: boolean;
  slug: string;
  tags: string[];
  title: string;
}

const countMatches = (value: string, pattern: RegExp) => [...value.matchAll(pattern)].length;

const createTerms = (value: string) => {
  const normalized = value.normalize('NFKC').toLocaleLowerCase('ja');
  const words = normalized.split(/[\s、。・,./:;!?()[\]{}「」『』【】]+/u).filter(Boolean);
  const terms = new Set(words.filter((word) => word.length >= 2));
  for (const word of words) {
    if (!/[ぁ-んァ-ヶ一-龠]/u.test(word) || word.length < 3) continue;
    for (let index = 0; index < word.length - 1; index += 1)
      terms.add(word.slice(index, index + 2));
  }
  return terms;
};

export const findRelatedWriterArticles = (
  source: { body: string; currentSlug?: string; tags: string; title: string },
  articles: WriterArticleReference[]
) => {
  const sourceTerms = createTerms(`${source.title} ${source.body.slice(0, 3000)}`);
  const sourceTags = new Set(
    source.tags
      .split(',')
      .map((tag) => tag.trim().toLocaleLowerCase('ja'))
      .filter(Boolean)
  );

  return articles
    .filter(
      (article) =>
        !article.draft &&
        article.slug !== source.currentSlug &&
        !source.body.includes(`/blog/${article.slug}`)
    )
    .map((article) => {
      const titleTerms = createTerms(article.title);
      const descriptionTerms = createTerms(article.description);
      const tagMatches = article.tags.filter((tag) =>
        sourceTags.has(tag.toLocaleLowerCase('ja'))
      ).length;
      const titleMatches = [...titleTerms].filter((term) => sourceTerms.has(term)).length;
      const descriptionMatches = [...descriptionTerms].filter((term) =>
        sourceTerms.has(term)
      ).length;
      return { ...article, score: tagMatches * 8 + titleMatches * 3 + descriptionMatches };
    })
    .filter((article) => article.score >= 4)
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title))
    .slice(0, 5);
};

export const analyzeWriterDraft = (
  title: string,
  body: string,
  knownArticleSlugs: string[] = []
): WriterAnalysis => {
  const headings: WriterHeading[] = [];
  const paragraphs: Array<{ offset: number; text: string }> = [];
  const lines = body.split('\n');
  let offset = 0;
  let inCodeBlock = false;
  let paragraphStart = 0;
  let paragraphLines: string[] = [];

  const finishParagraph = () => {
    const text = paragraphLines.join(' ').trim();
    if (text) paragraphs.push({ offset: paragraphStart, text });
    paragraphLines = [];
  };

  for (const line of lines) {
    if (/^\s*```/u.test(line)) {
      finishParagraph();
      inCodeBlock = !inCodeBlock;
      offset += line.length + 1;
      continue;
    }
    if (!inCodeBlock) {
      const heading = /^(#{2,6})\s+(.+?)\s*#*\s*$/u.exec(line);
      if (heading) {
        finishParagraph();
        headings.push({ level: heading[1].length, offset, text: heading[2] });
      } else if (
        !line.trim() ||
        /^\s*(?:[-*>]|\d+\.)\s/u.test(line) ||
        /^\s*!\[[^\]]*\]\([^)]+\)\s*$/u.test(line)
      ) {
        finishParagraph();
      } else {
        if (paragraphLines.length === 0) paragraphStart = offset;
        paragraphLines.push(line.trim());
      }
    }
    offset += line.length + 1;
  }
  finishParagraph();

  const plainCharacterCount = body.replace(/```[\s\S]*?```/gu, '').replace(/\s/gu, '').length;
  const internalLinks =
    countMatches(body, /\[\[[^\]]+\]\]/gu) +
    countMatches(body, /\[[^\]]+\]\((?:\/|https?:\/\/blog\.p1ass\.com)[^)]+\)/gu);
  const externalLinks = countMatches(body, /\[[^\]]+\]\(https?:\/\/(?!blog\.p1ass\.com)[^)]+\)/gu);
  const images = countMatches(body, /!\[[^\]]*\]\([^)]+\)/gu);
  const knownSlugs = new Set(knownArticleSlugs);
  const brokenInternalLinks =
    knownSlugs.size === 0
      ? []
      : [
          ...body.matchAll(
            /\[[^\]]+\]\(((?:\/blog\/|https?:\/\/blog\.p1ass\.com\/blog\/)([a-z0-9]+(?:-[a-z0-9]+)*))\)/gu
          ),
        ]
          .filter((match) => !knownSlugs.has(match[2] ?? ''))
          .map((match) => ({ offset: match.index, url: match[1] ?? '' }));
  const findings: WriterFinding[] = [];

  if (!title.trim()) findings.push({ text: 'タイトルを決める', type: 'improve' });
  else if (title.trim().length > 60)
    findings.push({ text: 'タイトルを60文字以内に収める', type: 'improve' });
  else findings.push({ text: 'タイトルの長さは適切', type: 'good' });

  if (plainCharacterCount < 600)
    findings.push({ text: '本文を600文字以上まで具体化する', type: 'improve' });
  else findings.push({ text: '本文に十分な情報量がある', type: 'good' });

  if (headings.length === 0 && plainCharacterCount >= 400)
    findings.push({ text: '見出しで内容を分ける', type: 'improve' });
  else if (headings.length > 0) findings.push({ text: '見出しで構造化されている', type: 'good' });

  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level > headings[index - 1].level + 1) {
      findings.push({
        offset: headings[index].offset,
        text: `「${headings[index].text}」の見出しレベルが飛んでいる`,
        type: 'improve',
      });
    }
  }

  const duplicateHeading = headings.find(
    (heading, index) => headings.findIndex((candidate) => candidate.text === heading.text) !== index
  );
  if (duplicateHeading)
    findings.push({
      offset: duplicateHeading.offset,
      text: `「${duplicateHeading.text}」の見出しが重複している`,
      type: 'improve',
    });

  const longParagraph = paragraphs.find((paragraph) => paragraph.text.length > 300);
  if (longParagraph)
    findings.push({
      offset: longParagraph.offset,
      text: '300文字を超える段落を分割する',
      type: 'improve',
    });
  else if (paragraphs.length > 0) findings.push({ text: '段落の長さは読みやすい', type: 'good' });

  const imageWithoutAlt = /!\[\s*\]\([^)]+\)/u.exec(body);
  if (imageWithoutAlt)
    findings.push({
      offset: imageWithoutAlt.index,
      text: '説明のない画像に代替テキストを付ける',
      type: 'improve',
    });

  if (plainCharacterCount >= 800 && internalLinks === 0)
    findings.push({ text: '関連記事かObsidianノートへのリンクを検討する', type: 'improve' });
  else if (internalLinks > 0) findings.push({ text: '内部リンクが含まれている', type: 'good' });

  if (brokenInternalLinks.length > 0)
    findings.push({
      offset: brokenInternalLinks[0].offset,
      text: `${brokenInternalLinks.length}件の内部リンク先が見つからない`,
      type: 'improve',
    });

  return {
    brokenInternalLinks,
    externalLinks,
    findings,
    headings,
    images,
    internalLinks,
    paragraphCount: paragraphs.length,
    readingMinutes: getReadingTimeMinutes(plainCharacterCount),
  };
};
