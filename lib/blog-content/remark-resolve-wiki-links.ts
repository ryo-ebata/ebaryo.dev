import path from 'node:path';
import { visit } from 'unist-util-visit';
import type { Link, Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import { readArticleFile } from './read-article';

interface RemarkResolveWikiLinksOptions {
  slug: string;
}

const WIKI_LINK_PATTERN = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/gu;

const getFallbackLabel = (target: string): string => {
  const normalized = target
    .replaceAll('\\', '/')
    .replace(/\.md$/iu, '')
    .replace(/\/index$/iu, '');
  return normalized.split('/').filter(Boolean).at(-1) ?? target;
};

const getPublicSlugCandidates = (target: string, currentSlug: string): string[] => {
  const normalized = target.replaceAll('\\', '/').replace(/\.md$/iu, '');
  const explicitPublicPath = normalized.match(/(?:^|\/)public\/blogs\/(.+)$/iu)?.[1];
  const blogsPath = normalized.match(/^blogs\/(.+)$/iu)?.[1];
  const directPath = explicitPublicPath ?? blogsPath;
  const candidates = directPath
    ? [directPath]
    : [normalized, path.posix.normalize(path.posix.join(currentSlug, normalized))];

  return [...new Set(candidates.map((candidate) => candidate.replace(/\/index$/iu, '')))].filter(
    (candidate) => candidate && !candidate.startsWith('.') && !candidate.startsWith('private/')
  );
};

const resolvePublicArticle = async (target: string, currentSlug: string) => {
  for (const slug of getPublicSlugCandidates(target, currentSlug)) {
    try {
      const article = await readArticleFile(slug);
      return { slug, title: String(article.frontmatter.title || getFallbackLabel(target)) };
    } catch {}
  }
  return null;
};

export const remarkResolveWikiLinks: Plugin<[RemarkResolveWikiLinksOptions], Root> = ({ slug }) => {
  return async (tree) => {
    const textNodes: Array<{ index: number; node: Text; parent: { children: unknown[] } }> = [];
    visit(tree, 'text', (node, index, parent) => {
      if (index === undefined || !parent || !node.value.includes('[[')) return;
      textNodes.push({ index, node, parent });
    });

    for (const { index, node, parent } of textNodes.reverse()) {
      const replacements: Array<Text | Link> = [];
      let cursor = 0;
      for (const match of node.value.matchAll(WIKI_LINK_PATTERN)) {
        const matchIndex = match.index;
        if (matchIndex > cursor)
          replacements.push({ type: 'text', value: node.value.slice(cursor, matchIndex) });

        const target = match[1].trim();
        const alias = match[2]?.trim();
        const fallbackLabel = alias || getFallbackLabel(target);
        if (target.startsWith('private/')) {
          replacements.push({ type: 'text', value: fallbackLabel });
        } else {
          const article = await resolvePublicArticle(target, slug);
          replacements.push(
            article
              ? {
                  children: [{ type: 'text', value: alias || article.title }],
                  type: 'link',
                  url: `/blog/${article.slug}`,
                }
              : { type: 'text', value: fallbackLabel }
          );
        }
        cursor = matchIndex + match[0].length;
      }
      if (replacements.length === 0) continue;
      if (cursor < node.value.length)
        replacements.push({ type: 'text', value: node.value.slice(cursor) });
      parent.children.splice(index, 1, ...replacements);
    }
  };
};
