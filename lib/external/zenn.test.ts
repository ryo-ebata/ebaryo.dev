import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const createMockZennArticle = (overrides: Record<string, unknown> = {}) => ({
  article_type: 'tech',
  body_letters_count: 1000,
  body_updated_at: '2025-01-02T00:00:00Z',
  bookmarked_count: 5,
  comments_count: 2,
  emoji: '🎉',
  id: 1,
  is_suspending_private: false,
  liked_count: 20,
  path: '/ebarinyo/articles/test-article',
  /* Zenn APIが実際に返すのはpinnedではなくpinned_by_*の2つ(どちらも未使用) */
  pinned_by_publication: false,
  pinned_by_user: false,
  post_type: 'Article',
  principal_type: 'User',
  publication: {
    avatar_registered: true,
    avatar_small_url: 'https://example.com/avatar-small.jpg',
    avatar_url: 'https://example.com/avatar.jpg',
    display_name: 'テスト出版',
    id: 1,
    name: 'test-pub',
    pro: false,
  },
  publication_article_override: null,
  published_at: '2025-01-01T00:00:00Z',
  slug: 'test-article',
  source_repo_updated_at: null,
  title: 'Zennテスト記事',
  user: {
    avatar_small_url: 'https://example.com/avatar.jpg',
    id: 1,
    name: 'テストユーザー',
    username: 'ebarinyo',
  },
  ...overrides,
});

describe('getZennArticles', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常にZenn記事を取得する', async () => {
    const mockArticle = createMockZennArticle();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          articles: [mockArticle],
          next_page: null,
          total_count: 1,
        }),
    } as Response);

    const { getZennArticles } = await import('./zenn');
    const result = await getZennArticles();

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].title).toBe('Zennテスト記事');
    expect(result.articles[0].liked_count).toBe(20);
  });

  it('API失敗時に空レスポンスを返す', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { getZennArticles } = await import('./zenn');
    const result = await getZennArticles();

    expect(result.articles).toEqual([]);
    expect(result.next_page).toBeNull();
    expect(result.total_count).toBeNull();
  });

  it('ネットワークエラー時に空レスポンスを返す', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { getZennArticles } = await import('./zenn');
    const result = await getZennArticles();

    expect(result.articles).toEqual([]);
  });

  it('Zodパースエラー時に空レスポンスを返す', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invalid: 'data' }),
    } as Response);

    const { getZennArticles } = await import('./zenn');
    const result = await getZennArticles();

    expect(result.articles).toEqual([]);
  });
});
