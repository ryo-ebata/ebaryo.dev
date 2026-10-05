export const OBSIDIAN_HINT_MIME = 'application/x-obsidian-note';

export const toObsidianTarget = (relativePath: string) =>
  `private/${relativePath.replaceAll('\\', '/').replace(/^\/+|\.md$/gi, '')}`;

export const createNoteExcerpt = (source: string, maxLength = 120) => {
  const plainText = source
    .replace(/^---[\s\S]*?---\s*/u, '')
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, '$2 $1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/[*_~`>|-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  return plainText.length > maxLength ? `${plainText.slice(0, maxLength).trimEnd()}…` : plainText;
};
