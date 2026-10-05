import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';
import { guardLocalApiRequest, localApiError } from '@/lib/local-api';
import { createNoteExcerpt, toObsidianTarget } from '@/lib/local-writer-hints';

const PRIVATE_ROOT_SEGMENTS = ['blog-obsidian', 'private'];
const PRIVATE_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), ...PRIVATE_ROOT_SEGMENTS);
const MAX_NOTES = 300;

const collectMarkdownFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== '_templates')
      .map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectMarkdownFiles(entryPath);
        if (entry.isFile() && entry.name.endsWith('.md')) return [entryPath];
        return [];
      })
  );
  return paths.flat();
};

export async function GET(request: Request) {
  const denied = guardLocalApiRequest(request);
  if (denied) return denied;

  try {
    const files = (await collectMarkdownFiles(PRIVATE_ROOT)).slice(0, MAX_NOTES);
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

    return NextResponse.json({
      notes: notes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)),
    });
  } catch {
    return localApiError('Obsidianの非公開ノートを読み込めませんでした', 500);
  }
}
