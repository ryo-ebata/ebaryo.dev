import { describe, expect, it } from 'vitest';
import type { Root } from 'hast';

import { extractToc } from './extract-toc';
import { createMarkdownToHastProcessor } from './markdown-pipeline';

const SLUG = 'test-post';

const toHast = async (markdown: string): Promise<Root> => {
  const processor = createMarkdownToHastProcessor(SLUG);
  return (await processor.run(processor.parse(markdown))) as Root;
};

describe('extractToc', () => {
  it('h2/h3 を id・テキスト・深さ付きで抽出する', async () => {
    const hast = await toHast('## はじめに\n\nx\n\n### 背景\n\n## まとめ\n');
    expect(extractToc(hast)).toEqual([
      { id: 'はじめに', text: 'はじめに', depth: 2 },
      { id: '背景', text: '背景', depth: 3 },
      { id: 'まとめ', text: 'まとめ', depth: 2 },
    ]);
  });

  it('h1/h4 以下は対象外', async () => {
    const hast = await toHast('# title\n\n## sec\n\n#### sub\n');
    expect(extractToc(hast).map((i) => i.text)).toEqual(['sec']);
  });

  it('重複見出しでも id が一意になり本文アンカーと整合する', async () => {
    const items = extractToc(await toHast('## Note\n\n## Note\n'));
    expect(items.map((i) => i.id)).toEqual(['note', 'note-1']);
  });

  it('見出しが無ければ空配列', async () => {
    expect(extractToc(await toHast('本文のみ\n'))).toEqual([]);
  });
});
