import type { Element, Root } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const PLAYGROUND_HOST = 'www.typescriptlang.org';
const PLAYGROUND_PATH = '/play';
const SAFE_IFRAME_STYLE = 'width:100%;height:480px;border:1px solid #e5e7eb;border-radius:8px;';

function isExternalUrl(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

function isSingleAnchorParagraph(node: Element): boolean {
  return (
    node.tagName === 'p' &&
    node.children.length === 1 &&
    node.children[0].type === 'element' &&
    node.children[0].tagName === 'a'
  );
}

function getAnchorHref(node: Element): string {
  const anchor = node.children[0];
  if (anchor.type !== 'element' || anchor.tagName !== 'a') {
    return '';
  }
  return String(anchor.properties?.href ?? '');
}

function isTypeScriptPlaygroundUrl(href: string): boolean {
  if (!isExternalUrl(href)) {
    return false;
  }
  try {
    const parsed = new URL(href);
    return parsed.hostname === PLAYGROUND_HOST && parsed.pathname === PLAYGROUND_PATH;
  } catch {
    return false;
  }
}

function createPlaygroundEmbedElement(href: string): Element {
  return {
    type: 'element',
    tagName: 'iframe',
    properties: {
      src: href,
      title: 'TypeScript Playground',
      loading: 'lazy',
      style: SAFE_IFRAME_STYLE,
      referrerpolicy: 'no-referrer',
    },
    children: [],
  };
}

export const rehypePlaygroundEmbed: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (index === undefined || !parent || !isSingleAnchorParagraph(node)) {
        return;
      }

      const href = getAnchorHref(node);
      if (!isTypeScriptPlaygroundUrl(href)) {
        return;
      }

      const iframeNode = createPlaygroundEmbedElement(href);
      parent.children[index] = iframeNode;
    });
  };
};
