import { describe, expect, it, vi, beforeEach } from 'vitest';
import path from 'node:path';
import { BLOG_CONTENT_ROOT } from './paths';

const mockReaddir = vi.fn();
const mockReadFile = vi.fn();

vi.mock('node:fs/promises', () => {
  const mocked = {
    readdir: (...args: unknown[]) => mockReaddir(...args),
    readFile: (...args: unknown[]) => mockReadFile(...args),
  };
  return { ...mocked, default: mocked };
});

interface MockDirent {
  name: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
}

const dir = (name: string): MockDirent => ({
  name,
  isFile: () => false,
  isDirectory: () => true,
});
const file = (name: string): MockDirent => ({
  name,
  isFile: () => true,
  isDirectory: () => false,
});

const enoent = () => Object.assign(new Error('ENOENT'), { code: 'ENOENT' });

const setupDirTree = (entries: Record<string, MockDirent[]>) => {
  mockReaddir.mockImplementation(async (targetDir: string) => {
    const result = entries[targetDir];
    if (!result) {
      throw enoent();
    }
    return result;
  });
};

interface FrontmatterInput {
  title: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  draft?: boolean;
}

const buildArticleFile = (fm: FrontmatterInput, body: string): string => {
  const lines = [
    `title: "${fm.title}"`,
    `createdAt: "${fm.createdAt}"`,
    `updatedAt: "${fm.updatedAt}"`,
  ];
  if (fm.description) {
    lines.push(`description: "${fm.description}"`);
  }
  if (fm.tags) {
    lines.push(`tags:`, ...fm.tags.map((tag) => `  - ${tag}`));
  }
  if (fm.draft !== undefined) {
    lines.push(`draft: ${fm.draft}`);
  }
  return `---\n${lines.join('\n')}\n---\n${body}`;
};

const setupArticleFiles = (files: Record<string, string>) => {
  mockReadFile.mockImplementation(async (targetPath: string) => {
    const content = files[targetPath];
    if (content === undefined) {
      throw enoent();
    }
    return content;
  });
};

describe('blog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPostsMetadata', () => {
    it('全記事のメタデータを取得する', async () => {
      setupDirTree({
        [BLOG_CONTENT_ROOT]: [dir('test-post')],
        [path.join(BLOG_CONTENT_ROOT, 'test-post')]: [file('index.md')],
      });
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'test-post', 'index.md')]: buildArticleFile(
          {
            title: 'テスト記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-02T00:00:00.000Z',
            tags: ['TypeScript'],
          },
          'テスト本文'
        ),
      });

      const { getAllPostsMetadata } = await import('./blog');
      const result = await getAllPostsMetadata();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('テスト記事');
      expect(result[0].slug).toBe('test-post');
      expect(result[0].tags).toEqual(['TypeScript']);
      expect(result[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(result[0].updatedAt).toBe('2025-01-02T00:00:00.000Z');
    });

    it('公開日が未来の記事を一覧から除外する', async () => {
      setupDirTree({
        [BLOG_CONTENT_ROOT]: [dir('scheduled-post')],
        [path.join(BLOG_CONTENT_ROOT, 'scheduled-post')]: [file('index.md')],
      });
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'scheduled-post', 'index.md')]: buildArticleFile(
          {
            title: '予約記事',
            createdAt: '2999-01-01T00:00:00.000Z',
            updatedAt: '2026-10-05T00:00:00.000Z',
          },
          '本文'
        ),
      });

      const { getAllPostsMetadata } = await import('./blog');
      await expect(getAllPostsMetadata()).resolves.toEqual([]);
    });

    it('ネストしたディレクトリの記事をslug(dir/nested-post)として取得する', async () => {
      setupDirTree({
        [BLOG_CONTENT_ROOT]: [dir('dir')],
        [path.join(BLOG_CONTENT_ROOT, 'dir')]: [dir('nested-post')],
        [path.join(BLOG_CONTENT_ROOT, 'dir', 'nested-post')]: [file('index.md')],
      });
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'dir', 'nested-post', 'index.md')]: buildArticleFile(
          {
            title: 'ネスト記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
          '本文'
        ),
      });

      const { getAllPostsMetadata } = await import('./blog');
      const result = await getAllPostsMetadata();

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('dir/nested-post');
    });

    it('imagesディレクトリはスキャン対象から除外する', async () => {
      setupDirTree({
        [BLOG_CONTENT_ROOT]: [dir('test-post')],
        [path.join(BLOG_CONTENT_ROOT, 'test-post')]: [file('index.md'), dir('images')],
      });
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'test-post', 'index.md')]: buildArticleFile(
          {
            title: 'テスト記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
          '本文'
        ),
      });

      const { getAllPostsMetadata } = await import('./blog');
      const result = await getAllPostsMetadata();

      expect(result).toHaveLength(1);
      expect(mockReaddir).not.toHaveBeenCalledWith(
        path.join(BLOG_CONTENT_ROOT, 'test-post', 'images'),
        expect.anything()
      );
    });

    it('createdAtの降順でソートされる', async () => {
      setupDirTree({
        [BLOG_CONTENT_ROOT]: [dir('older'), dir('newer')],
        [path.join(BLOG_CONTENT_ROOT, 'older')]: [file('index.md')],
        [path.join(BLOG_CONTENT_ROOT, 'newer')]: [file('index.md')],
      });
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'older', 'index.md')]: buildArticleFile(
          {
            title: '古い記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
          '本文'
        ),
        [path.join(BLOG_CONTENT_ROOT, 'newer', 'index.md')]: buildArticleFile(
          {
            title: '新しい記事',
            createdAt: '2025-01-10T00:00:00.000Z',
            updatedAt: '2025-01-10T00:00:00.000Z',
          },
          '本文'
        ),
      });

      const { getAllPostsMetadata } = await import('./blog');
      const result = await getAllPostsMetadata();

      expect(result.map((post) => post.slug)).toEqual(['newer', 'older']);
    });

    it('draft記事を除外する', async () => {
      setupDirTree({
        [BLOG_CONTENT_ROOT]: [dir('published'), dir('draft')],
        [path.join(BLOG_CONTENT_ROOT, 'published')]: [file('index.md')],
        [path.join(BLOG_CONTENT_ROOT, 'draft')]: [file('index.md')],
      });
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'published', 'index.md')]: buildArticleFile(
          {
            title: '公開記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            draft: false,
          },
          '公開本文'
        ),
        [path.join(BLOG_CONTENT_ROOT, 'draft', 'index.md')]: buildArticleFile(
          {
            title: '下書き記事',
            createdAt: '2025-01-02T00:00:00.000Z',
            updatedAt: '2025-01-02T00:00:00.000Z',
            draft: true,
          },
          '下書き本文'
        ),
      });

      const { getAllPostsMetadata } = await import('./blog');
      const result = await getAllPostsMetadata();

      expect(result.map((post) => post.slug)).toEqual(['published']);
    });

    it('記事が1件も無い場合は空配列を返す', async () => {
      setupDirTree({ [BLOG_CONTENT_ROOT]: [] });

      const { getAllPostsMetadata } = await import('./blog');
      const result = await getAllPostsMetadata();

      expect(result).toEqual([]);
    });
  });

  describe('getPostBySlug', () => {
    it('slugで記事を取得する', async () => {
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'test-post', 'index.md')]: buildArticleFile(
          {
            title: 'テスト記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
          'テスト本文'
        ),
      });

      const { getPostBySlug } = await import('./blog');
      const result = await getPostBySlug('test-post');

      expect(result.metadata.slug).toBe('test-post');
      expect(result.contentMarkdown).toBe('テスト本文');
    });

    it('配列slugを結合してファイルパスを解決する', async () => {
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'dir', 'nested-post', 'index.md')]: buildArticleFile(
          {
            title: 'ネスト記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
          '本文'
        ),
      });

      const { getPostBySlug } = await import('./blog');
      const result = await getPostBySlug(['dir', 'nested-post']);

      expect(result.metadata.slug).toBe('dir/nested-post');
    });

    it('記事が見つからない場合にエラーをスローする', async () => {
      setupArticleFiles({});

      const { getPostBySlug } = await import('./blog');
      await expect(getPostBySlug('not-found')).rejects.toThrow('Post not found: not-found');
    });

    it('draft記事は存在しないものとして扱う', async () => {
      setupArticleFiles({
        [path.join(BLOG_CONTENT_ROOT, 'draft', 'index.md')]: buildArticleFile(
          {
            title: '下書き記事',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            draft: true,
          },
          '下書き本文'
        ),
      });

      const { getPostBySlug } = await import('./blog');
      await expect(getPostBySlug('draft')).rejects.toThrow('Post not found: draft');
    });
  });
});
