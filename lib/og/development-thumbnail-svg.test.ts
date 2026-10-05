import { describe, expect, it } from 'vitest';
import { createDevelopmentThumbnailSvg } from './development-thumbnail-svg';

describe('createDevelopmentThumbnailSvg', () => {
  it('タイトルと媒体情報を含むSVGを生成する', () => {
    const svg = createDevelopmentThumbnailSvg({
      date: '2026-10-05',
      subtitle: 'Zenn',
      title: '開発用サムネイル',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('開発用サムネイル');
    expect(svg).toContain('Zenn / 2026.10.05');
  });

  it('XMLとして危険な文字をエスケープする', () => {
    const svg = createDevelopmentThumbnailSvg({ subtitle: 'Qiita', title: '<script>&"' });

    expect(svg).toContain('&lt;script&gt;&amp;&quot;');
    expect(svg).not.toContain('<script>');
  });

  it('splitレイアウトと配色を反映する', () => {
    const svg = createDevelopmentThumbnailSvg({
      layout: 'split',
      subtitle: 'Web開発',
      title: 'TypeScript v7へのアップデート',
      variant: 'indigo',
    });

    expect(svg).toContain('fill="#17213a"');
    expect(svg).toContain('width="330"');
    expect(svg).toContain('x="390"');
  });

  it('長いタイトルを領域内で折り返して省略する', () => {
    const svg = createDevelopmentThumbnailSvg({
      layout: 'split',
      subtitle: 'Web開発',
      title: '長い記事タイトル'.repeat(20),
      variant: 'indigo',
    });

    expect(svg.match(/class="title"/gu)).toHaveLength(4);
    expect(svg).toContain('…</text>');
    expect(svg).toContain('font-size: 40px');
  });
});
