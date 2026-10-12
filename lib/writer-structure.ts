export type WriterSectionStatus = 'empty' | 'evidence' | 'outline' | 'ready' | 'writing';

export interface WriterSectionEvidence {
  label: string;
  target: string;
  type: 'external' | 'note';
}

export interface WriterSection {
  characterCount: number;
  claim: string;
  evidence: WriterSectionEvidence[];
  heading: string;
  level: number;
  nextAction: string;
  offset: number;
  status: WriterSectionStatus;
}

export interface WriterStructureGap {
  offset?: number;
  text: string;
  type: 'evidence' | 'example' | 'flow';
}

export interface WriterStructureAnalysis {
  gaps: WriterStructureGap[];
  nextSection?: WriterSection;
  sections: WriterSection[];
}

const stripMarkdown = (value: string) =>
  value
    .replace(/<!--[\s\S]*?-->/gu, '')
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, '$2 $1')
    .replace(/^\s*(?:[-*>]|\d+\.)\s+/gmu, '')
    .replace(/[*_~`#]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();

const collectEvidence = (content: string): WriterSectionEvidence[] => {
  const evidence: WriterSectionEvidence[] = [];
  const seen = new Set<string>();
  for (const match of content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu)) {
    const target = match[1].trim();
    if (seen.has(target)) continue;
    seen.add(target);
    evidence.push({ label: (match[2] || target).trim(), target, type: 'note' });
  }
  for (const match of content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gu)) {
    const target = match[2].trim();
    if (seen.has(target)) continue;
    seen.add(target);
    evidence.push({ label: match[1].trim(), target, type: 'external' });
  }
  return evidence;
};

const firstSentence = (content: string) => {
  const plain = stripMarkdown(content);
  return plain.split(/(?<=[。！？!?])\s*/u)[0]?.slice(0, 100) ?? '';
};

const statusFor = (characterCount: number, evidenceCount: number): WriterSectionStatus => {
  if (characterCount < 20) return 'empty';
  if (characterCount < 100) return 'outline';
  if (evidenceCount === 0) return 'evidence';
  if (characterCount < 240) return 'writing';
  return 'ready';
};

const actionFor = (status: WriterSectionStatus) => {
  if (status === 'empty') return 'この章で伝える結論を書く';
  if (status === 'outline') return '判断理由か具体例を足す';
  if (status === 'evidence') return '根拠になるノートか出典を結ぶ';
  if (status === 'writing') return '読者が試せる具体例まで書く';
  return '推敲して確定する';
};

const isSupportingSection = (heading: string) => /^(?:参考|出典|脚注|関連)/u.test(heading);
const hasConcreteExample = (content: string) =>
  /(?:例えば|具体例|実際|ケース|\d|```|「[^」]+」)/u.test(content);

export const analyzeWriterStructure = (body: string): WriterStructureAnalysis => {
  const matches = [...body.matchAll(/^(#{2,6})\s+(.+?)\s*#*\s*$/gmu)];
  const sections = matches.map((match, index): WriterSection => {
    const contentStart = (match.index ?? 0) + match[0].length;
    const contentEnd = matches[index + 1]?.index ?? body.length;
    const content = body.slice(contentStart, contentEnd);
    const evidence = collectEvidence(content);
    const characterCount = stripMarkdown(content).replace(/\s/gu, '').length;
    const status = statusFor(characterCount, evidence.length);
    return {
      characterCount,
      claim: firstSentence(content),
      evidence,
      heading: match[2].trim(),
      level: match[1].length,
      nextAction: actionFor(status),
      offset: match.index ?? 0,
      status,
    };
  });

  const gaps: WriterStructureGap[] = [];
  if (sections.length > 1 && !/(?:この記事|はじめ|導入|背景|問題)/u.test(sections[0].heading))
    gaps.push({
      offset: sections[0].offset,
      text: '冒頭で読者の課題と記事の結論を示す',
      type: 'flow',
    });
  if (sections.length > 1 && !/(?:まとめ|結論|おわり|次に)/u.test(sections.at(-1)?.heading ?? ''))
    gaps.push({
      offset: sections.at(-1)?.offset,
      text: '最後に結論と読者が次に取る行動を置く',
      type: 'flow',
    });

  for (const section of sections) {
    if (isSupportingSection(section.heading)) continue;
    if (!section.claim)
      gaps.push({
        offset: section.offset,
        text: `「${section.heading}」の主張を書く`,
        type: 'flow',
      });
    else if (section.characterCount >= 100 && section.evidence.length === 0)
      gaps.push({
        offset: section.offset,
        text: `「${section.heading}」に根拠を結ぶ`,
        type: 'evidence',
      });

    const contentStart = section.offset + body.slice(section.offset).indexOf('\n');
    const nextOffset =
      sections.find((candidate) => candidate.offset > section.offset)?.offset ?? body.length;
    const content = body.slice(contentStart, nextOffset);
    if (section.characterCount >= 100 && !hasConcreteExample(content))
      gaps.push({
        offset: section.offset,
        text: `「${section.heading}」に具体例を足す`,
        type: 'example',
      });
  }

  const priorities: WriterSectionStatus[] = ['empty', 'outline', 'evidence', 'writing'];
  const nextSection = priorities
    .map((status) =>
      sections.find((section) => section.status === status && !isSupportingSection(section.heading))
    )
    .find((section): section is WriterSection => Boolean(section));

  return { gaps: gaps.slice(0, 8), nextSection, sections };
};
