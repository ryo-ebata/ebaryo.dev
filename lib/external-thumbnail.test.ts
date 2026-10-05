import { describe, expect, it } from 'vitest';
import { createExternalThumbnailPath } from './external-thumbnail';

describe('createExternalThumbnailPath', () => {
  it('媒体と記事IDから静的サムネイルのパスを作る', () => {
    expect(createExternalThumbnailPath('zenn', 123)).toBe('/external-thumbnails/zenn/123');
    expect(createExternalThumbnailPath('qiita', 'article-id')).toBe(
      '/external-thumbnails/qiita/article-id'
    );
  });
});
