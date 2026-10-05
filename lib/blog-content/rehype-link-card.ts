import type { Root, Element, Text } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { classifyLinkCardUrl } from '@/lib/link-card';
import { isAmazonJapanUrl, toAmazonAffiliateUrl } from '@/lib/amazon-affiliate';

function isTextNode(node: Element['children'][number]): node is Text {
  return node.type === 'text';
}

function getTextContent(node: Element): string {
  const texts: string[] = [];
  for (const child of node.children) {
    if (isTextNode(child)) {
      texts.push(child.value);
    }
  }
  return texts.join('');
}

function isNonWhitespaceText(node: Element['children'][number]): boolean {
  if (isTextNode(node)) {
    return node.value.trim().length > 0;
  }
  return node.type === 'element';
}

function isStandaloneLinkParagraph(node: Element): { href: string; label: string } | null {
  if (node.tagName !== 'p') {
    return null;
  }

  const significantChildren = node.children.filter(isNonWhitespaceText);

  if (significantChildren.length !== 1) {
    return null;
  }

  const child = significantChildren[0];
  if (child.type !== 'element' || (child as Element).tagName !== 'a') {
    return null;
  }

  const anchor = child as Element;
  const href = String(anchor.properties?.href ?? '');

  if (!classifyLinkCardUrl(href)) {
    return null;
  }

  const textContent = getTextContent(anchor);
  return { href, label: textContent };
}

function isIframelyEmbed(node: Element): { href: string; label: string } | null {
  if (node.tagName !== 'div') {
    return null;
  }

  const classNames = node.properties?.className;
  if (!Array.isArray(classNames) || !classNames.includes('iframely-responsive')) {
    return null;
  }

  const anchor = node.children.find(
    (child): child is Element => child.type === 'element' && child.tagName === 'a'
  );
  if (!anchor) {
    return null;
  }

  const href = String(anchor.properties?.href ?? '');
  if (!classifyLinkCardUrl(href)) {
    return null;
  }

  return { href, label: href };
}

function detectLinkCard(node: Element): { href: string; label: string } | null {
  return isStandaloneLinkParagraph(node) ?? isIframelyEmbed(node);
}

export const rehypeLinkCard: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'a') {
        const href = String(node.properties?.href ?? '');
        if (isAmazonJapanUrl(href)) {
          node.properties = {
            ...node.properties,
            href: toAmazonAffiliateUrl(href),
            rel: ['nofollow', 'noopener', 'noreferrer', 'sponsored'],
          };
        }
      }
      if (index === undefined || parent === undefined) {
        return;
      }

      const result = detectLinkCard(node);
      if (!result) {
        return;
      }
      const normalizedHref = toAmazonAffiliateUrl(result.href);
      const target = classifyLinkCardUrl(normalizedHref);
      if (!target) return;

      const linkCard: Element = {
        type: 'element',
        tagName: 'link-card',
        properties: {
          kind: target.kind,
          label: result.label === result.href ? target.display : result.label,
          url: target.href,
        },
        children: [],
      };

      parent.children[index] = linkCard;
    });
  };
};
