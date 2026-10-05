import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { trackProductEvent } from '@/lib/analytics';
import { ArticleEngagementTracker } from './article-engagement-tracker';

vi.mock('@/lib/analytics', () => ({
  trackProductEvent: vi.fn(),
}));

describe('ArticleEngagementTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('本文を50%以上読むと価値到達イベントを一度だけ送る', () => {
    const { container } = render(
      <>
        <article data-article-body />
        <ArticleEngagementTracker slug="example" />
      </>
    );
    const article = container.querySelector('article')!;
    Object.defineProperty(article, 'offsetHeight', { configurable: true, value: 1000 });
    vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
      bottom: 1000,
      height: 1000,
      left: 0,
      right: 0,
      toJSON: () => ({}),
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    });

    fireEvent.scroll(window);
    fireEvent.scroll(window);

    expect(trackProductEvent).toHaveBeenCalledOnce();
    expect(trackProductEvent).toHaveBeenCalledWith('article_value_reached', {
      article_slug: 'example',
      qualification_method: 'read_50_percent',
    });
  });

  it('7日以内の再訪を計測する', () => {
    localStorage.setItem('blog:last-visit-at', String(Date.now() - 24 * 60 * 60 * 1000));

    render(<ArticleEngagementTracker slug="example" />);

    expect(trackProductEvent).toHaveBeenCalledWith('reader_returned', {
      article_slug: 'example',
      days_since_last_visit: 1,
    });
  });
});
