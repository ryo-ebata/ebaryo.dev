import type { BaseContentMetadata } from './content';

export interface ContentTheme {
  description: string;
  name: string;
  slug: string;
  tags: string[];
}

export const contentThemes: ContentTheme[] = [
  {
    description: '生成AIやClaude Codeを、開発と仕事で安全に活用するための実践。',
    name: '生成AIと開発',
    slug: 'ai-development',
    tags: ['AI', '生成AI', 'ClaudeCode', 'MCP'],
  },
  {
    description: 'TypeScript、JavaScript、CSSを中心にしたWebフロントエンドの知見。',
    name: 'Web開発',
    slug: 'web-development',
    tags: ['TypeScript', 'JavaScript', 'CSS', 'フロントエンド'],
  },
  {
    description: '知識管理、開発生産性、マネジメントを自分の仕事へつなげる考察。',
    name: '知識と仕事',
    slug: 'knowledge-work',
    tags: ['PKM', 'Obsidian', '開発生産性', 'マネジメント', '読書'],
  },
];

export const getThemeBySlug = (slug: string): ContentTheme | undefined =>
  contentThemes.find((theme) => theme.slug === slug);

export const getThemePosts = (
  theme: ContentTheme,
  posts: BaseContentMetadata[]
): BaseContentMetadata[] =>
  posts.filter((post) => post.tags?.some((tag) => theme.tags.includes(tag)));

export const getThemesForTags = (tags: string[] = []): ContentTheme[] =>
  contentThemes.filter((theme) => tags.some((tag) => theme.tags.includes(tag)));

export const getLatestPostDate = (posts: BaseContentMetadata[]): Date | undefined => {
  const timestamps = posts
    .map((post) => new Date(post.updatedAt || post.createdAt).getTime())
    .filter(Number.isFinite);

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...timestamps));
};
