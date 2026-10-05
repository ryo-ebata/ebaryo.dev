import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentLinkCard } from './content-link-card';

vi.mock('node:dns/promises', () => {
  const lookup = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]);
  return { default: { lookup }, lookup };
});

/*
 * ContentLinkCardはServer Componentのため、テストではawaitで直接呼び出す
 * oxlint-disable new-cap
 */

/*
 * Next.js Imageコンポーネントのモック
 */
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    /* Biome-ignore lint/performance/noImgElement: テスト用のモックでは<img>を使用 */
    return <img src={src} alt={alt} {...props} />;
  },
}));

/*
 * Fetchのモック
 */
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ContentLinkCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OGPデータを持つURLでリンクカードを表示する', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>テストページ</title>
          <meta property="og:image" content="https://example.com/image.png" />
          <meta property="og:description" content="テストの説明文" />
        </head>
        <body></body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    const { container } = render(await ContentLinkCard({ url: 'https://example.com/test' }));

    expect(screen.getByText('テストページ')).toBeInTheDocument();
    expect(screen.getByText('テストの説明文')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com/test');
    expect(link).toHaveAttribute('target', '_blank');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('内部リンクはfetchせずブログ内カードを表示する', async () => {
    const { container } = render(
      await ContentLinkCard({ kind: 'internal', label: '関連記事', url: '/blog/example' })
    );

    expect(screen.getByText('関連記事')).toBeInTheDocument();
    expect(screen.getByText('このブログ内の記事')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(container.querySelector('a')).not.toHaveAttribute('target');
  });

  it('画像がない場合でもタイトルがあれば表示する', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>画像なしページ</title>
        </head>
        <body></body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(await ContentLinkCard({ url: 'https://example.com/no-image' }));

    expect(screen.getByText('画像なしページ')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('タイトルがない場合はフォールバックカードを表示する', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body></body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(await ContentLinkCard({ url: 'https://example.com/no-title' }));

    expect(screen.getAllByText('example.com')).not.toHaveLength(0);
    expect(screen.getByText('外部リンク')).toBeInTheDocument();
  });

  it('fetchが失敗した場合はフォールバックカードを表示する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    render(await ContentLinkCard({ url: 'https://example.com/error' }));

    expect(screen.getAllByText('example.com')).not.toHaveLength(0);
    expect(screen.getByText('外部リンク')).toBeInTheDocument();
  });

  it('fetchでエラーが発生した場合はフォールバックカードを表示する', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(await ContentLinkCard({ url: 'https://example.com/network-error' }));

    expect(screen.getAllByText('example.com')).not.toHaveLength(0);
    expect(screen.getByText('外部リンク')).toBeInTheDocument();
  });

  it('ローカルネットワークへのアクセスを拒否する', async () => {
    render(await ContentLinkCard({ url: 'http://127.0.0.1/private' }));

    expect(screen.getAllByText('127.0.0.1')).not.toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('Amazonリンクを広告として明示する', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const { container } = render(
      await ContentLinkCard({ url: 'https://www.amazon.co.jp/dp/4776209365?tag=error99-22' })
    );

    expect(screen.getByText('広告・Amazon')).toBeInTheDocument();
    expect(container.querySelector('a')).toHaveAttribute(
      'rel',
      'nofollow noopener noreferrer sponsored'
    );
  });

  it('twitter:imageをog:imageの代わりに使用する', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Twitterカード</title>
          <meta name="twitter:image" content="https://example.com/twitter-image.png" />
        </head>
        <body></body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    render(await ContentLinkCard({ url: 'https://example.com/twitter' }));

    expect(screen.getByText('Twitterカード')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/twitter-image.png');
  });
});
