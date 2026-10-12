export interface WriterIdeaNote {
  excerpt: string;
  sources: string[];
  target: string;
  title: string;
}

export interface WriterIdeaInput {
  description: string;
  tags: string[];
  title: string;
  notes: WriterIdeaNote[];
}

export interface WriterIdea {
  angle: string;
  audience: string;
  body: string;
  id: string;
  noteCount: number;
  sources: Array<{ target: string; title: string }>;
  tags: string[];
  title: string;
}

const labelFromTag = (tag: string) => tag.replace(/^(?:topic|project)\//u, '');

type IdeaFormat = 'decision' | 'failure' | 'selection';

const formats: Array<{
  angle: (topic: string, description: string) => string;
  audience: (topic: string) => string;
  heading: (title: string, index: number) => string;
  id: IdeaFormat;
  title: (topic: string) => string;
}> = [
  {
    angle: (topic, description) =>
      description || `${topic}を構成する概念を、実務の判断へつなげる。`,
    audience: (topic) => `${topic}を知識として知っているが、現場での使い方に迷っている人`,
    heading: (title) => title,
    id: 'decision',
    title: (topic) => `${topic}を実践で使うための判断軸`,
  },
  {
    angle: (topic) => `${topic}を形式的に導入した時に起きる失敗から、適用条件を逆算する。`,
    audience: (topic) => `${topic}を導入したが、期待した効果を得られていない人`,
    heading: (title, index) => `失敗${index + 1}: ${title}を目的化する`,
    id: 'failure',
    title: (topic) => `${topic}で失敗しやすい判断`,
  },
  {
    angle: (topic) => `${topic}が向く状況と向かない状況を、選定条件として整理する。`,
    audience: (topic) => `${topic}を採用するか、別の方法を選ぶか判断したい人`,
    heading: (title) => `判断条件: ${title}`,
    id: 'selection',
    title: (topic) => `${topic}を選ぶ前に確認したい設計条件`,
  },
];

const createWriterIdeaForFormat = (
  input: WriterIdeaInput,
  format: (typeof formats)[number]
): WriterIdea | null => {
  const notes = input.notes.filter((note) => note.excerpt.trim()).slice(0, 6);
  if (notes.length < 2) return null;
  const topic = input.title;
  const sourceLinks = [...new Set(notes.flatMap((note) => note.sources))];
  const angle = format.angle(topic, input.description);
  const noteSections = notes
    .map(
      (note, index) =>
        `## ${format.heading(note.title, index)}\n\n${note.excerpt}\n\n<!-- 根拠: [[${note.target}|${note.title}]]。この章の主張、判断基準、具体例を書く。 -->`
    )
    .join('\n\n');
  const references = sourceLinks.length
    ? `\n\n## 参考資料\n\n${sourceLinks.map((source) => `- ${source}`).join('\n')}`
    : '';
  return {
    angle,
    audience: format.audience(topic),
    body: `## この記事で扱うこと\n\n${angle}\n\n${noteSections}\n\n## 実務での判断\n\n各概念をどの状況で使い、何を基準に選ぶかを書く。\n\n## 失敗しやすい使い方\n\n概念を形式的に適用した場合の副作用と、判断を誤りやすい条件を書く。\n\n## まとめ\n\n読者が次に試せる具体的な行動を書く。${references}`,
    id: `${input.title.normalize('NFC')}-${format.id}`,
    noteCount: notes.length,
    sources: notes.map(({ target, title: noteTitle }) => ({ target, title: noteTitle })),
    tags: input.tags.map(labelFromTag).filter((tag) => !tag.startsWith('source/')),
    title: format.title(topic),
  };
};

export const createWriterIdea = (input: WriterIdeaInput): WriterIdea | null =>
  createWriterIdeaForFormat(input, formats[0]);

export const rankWriterIdeas = (inputs: WriterIdeaInput[], limit = 8): WriterIdea[] => {
  const rankedInputs = [...inputs].sort(
    (first, second) =>
      second.notes.length - first.notes.length || first.title.localeCompare(second.title, 'ja')
  );
  return formats
    .flatMap((format) =>
      rankedInputs
        .map((input) => createWriterIdeaForFormat(input, format))
        .filter((idea): idea is WriterIdea => idea !== null)
    )
    .slice(0, limit);
};
