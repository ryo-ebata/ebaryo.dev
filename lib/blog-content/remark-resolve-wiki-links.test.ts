import { describe, expect, it, vi } from 'vitest';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Root } from 'mdast';
import { remarkResolveWikiLinks } from './remark-resolve-wiki-links';

vi.mock('./read-article', () => ({
  readArticleFile: vi.fn(async (slug: string) => {
    if (slug !== 'linked-article') throw new Error('not found');
    return { content: '', frontmatter: { title: '公開記事のタイトル' } };
  }),
}));

const transform = async (markdown: string): Promise<Root> => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkResolveWikiLinks, { slug: 'current-article' });
  return (await processor.run(processor.parse(markdown))) as Root;
};

describe('remarkResolveWikiLinks', () => {
  it('Privateノートは別名だけを表示する', async () => {
    const tree = await transform('参考: [[private/ideas/secret|記事のヒント]]');
    const paragraph = tree.children[0];

    expect(paragraph.type).toBe('paragraph');
    expect(
      paragraph.type === 'paragraph'
        ? paragraph.children.map((child) => ('value' in child ? child.value : '')).join('')
        : ''
    ).toBe('参考: 記事のヒント');
  });

  it('Public記事は内部リンクへ変換する', async () => {
    const tree = await transform('[[public/blogs/linked-article/index]]');

    expect(tree.children[0]).toMatchObject({
      children: [
        {
          children: [{ type: 'text', value: '公開記事のタイトル' }],
          type: 'link',
          url: '/blog/linked-article',
        },
      ],
      type: 'paragraph',
    });
  });

  it('未解決リンクも角括弧を公開しない', async () => {
    const tree = await transform('[[missing-note]]');

    expect(tree.children[0]).toMatchObject({
      children: [{ type: 'text', value: 'missing-note' }],
      type: 'paragraph',
    });
  });
});
