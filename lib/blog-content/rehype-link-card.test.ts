import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';
import { siteConfig } from '@/config/site';
import { rehypeLinkCard } from './rehype-link-card';

const processHtml = (html: string): Root => {
  const tree = unified().use(rehypeParse, { fragment: true }).parse(html);
  const result = unified().use(rehypeLinkCard).runSync(tree);
  return result as Root;
};

const findElements = (tree: Root, tagName: string): Element[] => {
  const elements: Element[] = [];
  visit(tree, 'element', (node: Element) => {
    if (node.tagName === tagName) {
      elements.push(node);
    }
  });
  return elements;
};

describe('rehypeLinkCard', () => {
  it('<p><a href="URL">URL</a></p> パターンが link-card に変換される', () => {
    const html = '<p><a href="https://example.com">https://example.com</a></p>';
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(1);
    expect(linkCards[0].properties?.url).toBe('https://example.com');

    const paragraphs = findElements(tree, 'p');
    expect(paragraphs).toHaveLength(0);
  });

  it('インラインリンク（テキストとリンクが混在）は変換されない', () => {
    const html = '<p>テキスト<a href="https://example.com">リンク</a>テキスト</p>';
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(0);

    const paragraphs = findElements(tree, 'p');
    expect(paragraphs).toHaveLength(1);
  });

  it('単独行ならラベル付きリンクも変換する', () => {
    const html = '<p><a href="https://example.com">クリックして</a></p>';
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(1);
    expect(linkCards[0].properties?.label).toBe('クリックして');
  });

  it('ブログ内部リンクを内部カードへ変換する', () => {
    const html = '<p><a href="/blog/example">関連記事</a></p>';
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(1);
    expect(linkCards[0].properties).toMatchObject({
      kind: 'internal',
      label: '関連記事',
      url: '/blog/example',
    });
  });

  it('同一サイトの絶対URLを短い内部リンクへ正規化する', () => {
    const html = `<p><a href="${siteConfig.url}/blog/example">${siteConfig.url}/blog/example</a></p>`;
    const tree = processHtml(html);

    expect(findElements(tree, 'link-card')[0].properties).toMatchObject({
      kind: 'internal',
      label: '/blog/example',
      url: '/blog/example',
    });
  });

  it('カード対象外の相対リンクは変換しない', () => {
    const tree = processHtml('<p><a href="/about">概要</a></p>');

    expect(findElements(tree, 'link-card')).toHaveLength(0);
  });

  it('複数のリンクカードを正しく変換する', () => {
    const html = `
      <p><a href="https://example.com">https://example.com</a></p>
      <p>普通のテキスト</p>
      <p><a href="https://google.com">https://google.com</a></p>
    `;
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(2);
    expect(linkCards[0].properties?.url).toBe('https://example.com');
    expect(linkCards[1].properties?.url).toBe('https://google.com');
  });

  it('http:// リンクも変換される', () => {
    const html = '<p><a href="http://example.com">http://example.com</a></p>';
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(1);
    expect(linkCards[0].properties?.url).toBe('http://example.com');
  });

  it('p要素内にa要素以外の子がある場合は変換しない', () => {
    const html = '<p><a href="https://example.com">https://example.com</a><br /></p>';
    const tree = processHtml(html);

    const linkCards = findElements(tree, 'link-card');
    expect(linkCards).toHaveLength(0);
  });

  it('インラインAmazonリンクへ広告属性を付ける', () => {
    const tree = processHtml(
      '<p>本は<a href="https://www.amazon.co.jp/dp/4776209365">こちら</a></p>'
    );
    const anchor = findElements(tree, 'a')[0];

    expect(anchor.properties?.rel).toEqual(['nofollow', 'noopener', 'noreferrer', 'sponsored']);
  });

  describe('iframely形式', () => {
    it('iframely-responsive div が link-card に変換される', () => {
      const html =
        '<div class="iframely-responsive"><a href="https://example.com" data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com"></a></div>';
      const tree = processHtml(html);

      const linkCards = findElements(tree, 'link-card');
      expect(linkCards).toHaveLength(1);
      expect(linkCards[0].properties?.url).toBe('https://example.com');

      const divs = findElements(tree, 'div');
      const iframelyDivs = divs.filter(
        (d) =>
          Array.isArray(d.properties?.className) &&
          (d.properties.className as string[]).includes('iframely-responsive')
      );
      expect(iframelyDivs).toHaveLength(0);
    });

    it('iframely-responsive div にstyleがあっても変換される', () => {
      const html =
        '<div class="iframely-responsive" style="padding-bottom: 52.3333%; padding-top: 120px;"><a href="https://tailscale.com" data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Ftailscale.com&amp;key=abc123"></a></div>';
      const tree = processHtml(html);

      const linkCards = findElements(tree, 'link-card');
      expect(linkCards).toHaveLength(1);
      expect(linkCards[0].properties?.url).toBe('https://tailscale.com');
    });

    it('iframely-responsive でないdivは変換されない', () => {
      const html =
        '<div class="other-class"><a href="https://example.com" data-iframely-url="https://cdn.iframe.ly/api/iframe"></a></div>';
      const tree = processHtml(html);

      const linkCards = findElements(tree, 'link-card');
      expect(linkCards).toHaveLength(0);
    });

    it('複数のiframely リンクカードを正しく変換する', () => {
      const html = `
        <div class="iframely-responsive"><a href="https://example.com" data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com"></a></div>
        <p>普通のテキスト</p>
        <div class="iframely-responsive"><a href="https://google.com" data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fgoogle.com"></a></div>
      `;
      const tree = processHtml(html);

      const linkCards = findElements(tree, 'link-card');
      expect(linkCards).toHaveLength(2);
      expect(linkCards[0].properties?.url).toBe('https://example.com');
      expect(linkCards[1].properties?.url).toBe('https://google.com');
    });

    it('iframely形式とp>a形式が混在しても両方変換される', () => {
      const html = `
        <div class="iframely-responsive"><a href="https://example.com" data-iframely-url="https://cdn.iframe.ly/api/iframe"></a></div>
        <p><a href="https://google.com">https://google.com</a></p>
      `;
      const tree = processHtml(html);

      const linkCards = findElements(tree, 'link-card');
      expect(linkCards).toHaveLength(2);
      expect(linkCards[0].properties?.url).toBe('https://example.com');
      expect(linkCards[1].properties?.url).toBe('https://google.com');
    });
  });
});
