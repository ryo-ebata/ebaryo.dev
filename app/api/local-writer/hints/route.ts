import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import {
  createClippingLinkMarkdown,
  createKindleAffiliateMarkdown,
  createNoteExcerpt,
  isObsidianDailyNotePath,
  toObsidianTarget,
} from '@/lib/local-writer-hints';

const PRIVATE_ROOT_SEGMENTS = ['blog-obsidian', 'private'];
const PRIVATE_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), ...PRIVATE_ROOT_SEGMENTS);
const NOTES_ROOT = path.join(PRIVATE_ROOT, 'notes');
const CLIPPING_ROOT = path.join(PRIVATE_ROOT, 'clipping');
const KINDLE_ROOT = path.join(PRIVATE_ROOT, 'kindle');
const MAX_NOTES = 300;
const EXCLUDED_NOTE_DIRECTORIES = new Set(['clipping', 'daily', 'kindle']);

const collectMarkdownFiles = async (
  directory: string,
  excludeSpecialDirectories = true
): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== '_templates')
      .map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        const relativePath = path.relative(PRIVATE_ROOT, entryPath);
        const rootDirectory = relativePath.split(path.sep)[0]?.toLowerCase();
        if (
          excludeSpecialDirectories &&
          (isObsidianDailyNotePath(relativePath) || EXCLUDED_NOTE_DIRECTORIES.has(rootDirectory))
        ) {
          return [];
        }
        if (entry.isDirectory()) return collectMarkdownFiles(entryPath, excludeSpecialDirectories);
        if (entry.isFile() && entry.name.endsWith('.md')) return [entryPath];
        return [];
      })
  );
  return paths.flat();
};

const readSourceHints = async (
  directory: string,
  createHint: (
    data: Record<string, unknown>,
    title: string
  ) => {
    description: string;
    insertText: string;
    targetLabel: string;
  } | null
) => {
  const files = await collectMarkdownFiles(directory, false);
  const hints = await Promise.all(
    files.map(async (filePath) => {
      const [source, fileStat] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)]);
      const { content, data } = matter(source);
      const title = String(data.title || data['kindle-title'] || path.basename(filePath, '.md'));
      const hint = createHint(data, title);
      return hint
        ? {
            ...hint,
            modifiedAt: fileStat.mtime.toISOString(),
            title,
            description: hint.description || createNoteExcerpt(content),
          }
        : null;
    })
  );
  return hints
    .filter((hint) => hint !== null)
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
};

export async function GET(request: Request) {
  const denied = guardLocalApiRequest(request);
  if (denied) return denied;

  try {
    const files = (await collectMarkdownFiles(NOTES_ROOT)).slice(0, MAX_NOTES);
    const notes = await Promise.all(
      files.map(async (filePath) => {
        const [source, fileStat] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)]);
        const { content, data } = matter(source);
        const relativePath = path.relative(PRIVATE_ROOT, filePath);
        return {
          excerpt: createNoteExcerpt(content),
          modifiedAt: fileStat.mtime.toISOString(),
          target: toObsidianTarget(relativePath),
          title: String(data.title || path.basename(filePath, '.md')),
        };
      })
    );

    const [clippings, kindleBooks] = await Promise.all([
      readSourceHints(CLIPPING_ROOT, (data, title) => {
        const source = typeof data.source === 'string' ? data.source : '';
        if (!URL.canParse(source)) return null;
        return {
          description: typeof data.description === 'string' ? data.description : '',
          insertText: createClippingLinkMarkdown(source, title),
          targetLabel: new URL(source).hostname,
        };
      }),
      readSourceHints(KINDLE_ROOT, (data, title) => {
        const kindleSync =
          typeof data['kindle-sync'] === 'object' && data['kindle-sync'] !== null
            ? (data['kindle-sync'] as Record<string, unknown>)
            : {};
        const asin = String(data['kindle-asin'] || kindleSync.asin || '').trim();
        if (!asin) return null;
        const author = String(data['kindle-author'] || kindleSync.author || '').trim();
        return {
          description: author,
          insertText: createKindleAffiliateMarkdown(asin, title),
          targetLabel: `Amazon · ${asin}`,
        };
      }),
    ]);

    return NextResponse.json({
      clippings,
      kindleBooks,
      notes: notes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)),
    });
  } catch {
    return localApiError('Obsidianの非公開ノートを読み込めませんでした', 500);
  }
}
