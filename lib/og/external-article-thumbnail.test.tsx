import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  createExternalArticleThumbnailSvg,
  ExternalArticleThumbnail,
} from './external-article-thumbnail';

const LOGO_DATA_URL = 'data:image/png;base64,bG9nbw==';

describe('ExternalArticleThumbnail', () => {
  it.each([
    ['zenn', 'Zenn', '#3ea8ff'],
    ['qiita', 'Qiita', '#55c500'],
  ] as const)('%s専用のブランド表現を使う', (source, label, color) => {
    const rendered = renderToStaticMarkup(
      <ExternalArticleThumbnail
        date="2025-01-01"
        logoSrc={LOGO_DATA_URL}
        source={source}
        title="外部記事のタイトル"
      />
    );

    expect(rendered).toContain(label);
    expect(rendered).toContain(color);
    expect(rendered).toContain(LOGO_DATA_URL);
    expect(rendered).toContain('外部記事のタイトル');
  });
});

describe('createExternalArticleThumbnailSvg', () => {
  it('長いタイトルを省略し、ロゴを埋め込む', () => {
    const svg = createExternalArticleThumbnailSvg({
      logoSrc: LOGO_DATA_URL,
      source: 'zenn',
      title:
        '非常に長い外部記事のタイトルを適切な位置で折り返して見切れないように表示するためのテストタイトル'.repeat(
          2
        ),
    });

    expect(svg).toContain('…');
    expect(svg).toContain(LOGO_DATA_URL);
    expect(svg).toContain('Zenn');
  });
});
