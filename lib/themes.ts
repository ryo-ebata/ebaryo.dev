export interface ContentTheme {
  name: string;
  tags: string[];
}

const contentThemes: ContentTheme[] = [
  {
    name: '生成AIと開発',
    tags: ['AI', '生成AI', 'ClaudeCode', 'MCP'],
  },
  {
    name: 'Web開発',
    tags: ['TypeScript', 'JavaScript', 'CSS', 'フロントエンド'],
  },
  {
    name: '知識と仕事',
    tags: ['PKM', 'Obsidian', '開発生産性', 'マネジメント', '読書'],
  },
];

export const getThemesForTags = (tags: string[] = []): ContentTheme[] =>
  contentThemes.filter((theme) => tags.some((tag) => theme.tags.includes(tag)));
