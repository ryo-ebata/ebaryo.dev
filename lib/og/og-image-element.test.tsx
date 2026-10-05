import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OgImageElement } from './og-image-element';

describe('OgImageElement', () => {
  it('タイトルを表示する', () => {
    const element = OgImageElement({ title: 'テストタイトル' });
    const rendered = renderToStaticMarkup(element);

    expect(rendered).toContain('テストタイトル');
  });

  it('サブタイトルを表示する', () => {
    const element = OgImageElement({ title: 'メイン', subtitle: 'サブ' });
    const rendered = renderToStaticMarkup(element);

    expect(rendered).toContain('サブ');
  });

  it('サブタイトルなしでもレンダリングできる', () => {
    const element = OgImageElement({ title: 'タイトルのみ' });
    const rendered = renderToStaticMarkup(element);

    expect(rendered).toContain('タイトルのみ');
  });

  it('サイト名を含む', () => {
    const element = OgImageElement({ title: 'テスト' });
    const rendered = renderToStaticMarkup(element);

    expect(rendered).toContain('ebaryo.dev');
  });

  it('指定したデザインの配色を使う', () => {
    const element = OgImageElement({ title: 'テスト', variant: 'ink' });

    expect(renderToStaticMarkup(element)).toContain('#20211f');
  });

  it.each(['editorial', 'poster', 'split', 'frame'] as const)(
    '%s構図でタイトルと補助テキストを表示する',
    (layout) => {
      const rendered = renderToStaticMarkup(
        OgImageElement({ layout, subtitle: 'Web開発', title: '読みやすい設計' })
      );

      expect(rendered).toContain('読みやすい設計');
      expect(rendered).toContain('Web開発');
      expect(rendered).toContain('<svg');
    }
  );

  it.each(['native', 'orbit', 'grid', 'modules', 'rays'] as const)(
    '%s模様をレンダリングできる',
    (motif) => {
      const rendered = renderToStaticMarkup(OgImageElement({ motif, title: '幾何学のある記事' }));

      expect(rendered).toContain('幾何学のある記事');
      expect(rendered).toContain('<svg');
    }
  );
});
