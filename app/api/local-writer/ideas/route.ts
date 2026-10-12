import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import { createNoteExcerpt, toObsidianTarget } from '@/lib/local-writer-hints';
import { rankWriterIdeas, type WriterIdeaNote } from '@/lib/writer-ideas';

const PRIVATE_ROOT = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  'blog-obsidian',
  'private'
);
const MAPS_ROOT = path.join(PRIVATE_ROOT, 'maps');
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');

const readMarkdownDirectory = async (directory: string) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map(async (entry) => {
        const filePath = path.join(directory, entry.name);
        const source = await readFile(filePath, 'utf8');
        return { filePath, title: path.basename(entry.name, '.md'), ...matter(source) };
      })
  );
};

const toStringList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const mapNoteTitles = (content: string) =>
  [...content.matchAll(/\[\[(?:\.\.\/notes\/|private\/notes\/)([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)].map(
    (match) => decodeURIComponent(match[1]).replace(/\.md$/u, '').normalize('NFC')
  );

export async function GET(request: Request) {
  const denied = guardLocalApiRequest(request);
  if (denied) return denied;

  try {
    const [maps, notes] = await Promise.all([
      readMarkdownDirectory(MAPS_ROOT),
      readMarkdownDirectory(NOTES_ROOT),
    ]);
    const notesByTitle = new Map<string, WriterIdeaNote>(
      notes.map(({ content, data, filePath, title }) => [
        title.normalize('NFC'),
        {
          excerpt: createNoteExcerpt(content, 180),
          sources: toStringList(data.sources),
          target: toObsidianTarget(path.relative(PRIVATE_ROOT, filePath)),
          title,
        },
      ])
    );
    const ideas = rankWriterIdeas(
      maps.map(({ content, data, title }) => ({
        description: createNoteExcerpt(content.split(/^##\s+/mu)[0] ?? '', 180),
        notes: mapNoteTitles(content)
          .map((noteTitle) => notesByTitle.get(noteTitle))
          .filter((note): note is WriterIdeaNote => note !== undefined),
        tags: toStringList(data.tags),
        title,
      }))
    );
    return NextResponse.json({ ideas });
  } catch {
    return localApiError('Obsidianから記事案を作れませんでした', 500);
  }
}
