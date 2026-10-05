import { beforeEach, describe, expect, it } from 'vitest';
import { trackProductEvent } from './analytics';

describe('trackProductEvent', () => {
  beforeEach(() => {
    delete (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  });

  it('イベントとパラメータをdataLayerへ送る', () => {
    trackProductEvent('content_link_click', {
      destination_path: '/blog/example',
      placement: 'related_posts',
    });

    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([
      {
        event: 'content_link_click',
        destination_path: '/blog/example',
        placement: 'related_posts',
      },
    ]);
  });
});
