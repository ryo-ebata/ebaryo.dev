#!/usr/bin/env node
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

const PRIVATE_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private'
);
const IMPORTS_ROOT = path.join(PRIVATE_ROOT, 'archive', 'imports');
const BACKUP_PATH = path.join(IMPORTS_ROOT, 'obsidian-frontmatter-before-status-refinement.zip');
const STAGING_ROOT = path.join(IMPORTS_ROOT, '.obsidian-frontmatter-before-status-refinement');
const WRITE_FLAG = '--write';

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed: ${stderr.trim()}`))
    );
  });

const collectMarkdown = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdown(target)));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(target);
  }
  return files;
};

const stringList = (value) => {
  if (Array.isArray(value))
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

const unique = (values) => [...new Set(values)];
const noteTitle = (filePath) => path.basename(filePath, '.md').normalize('NFC');

const MAP_METADATA = {
  'Apache Parquet': { aliases: ['Parquet'], tags: ['topic/data'] },
  DORA: {
    aliases: ['DevOps Research and Assessment'],
    tags: ['topic/devops', 'topic/engineering-metrics'],
  },
  FTA: {
    aliases: ['Fault Tree Analysis', '故障の木解析'],
    tags: ['topic/analysis', 'topic/reliability'],
  },
  KPT: { aliases: ['Keep Problem Try'], tags: ['topic/retrospective'] },
  Orion: { tags: ['project/orion'] },
  SPACE: { tags: ['topic/developer-productivity', 'topic/engineering-metrics'] },
  TUKURUS: { tags: ['project/tukurus'] },
};

const normalizeTag = (tag) => {
  const normalized = tag.trim().replaceAll('_', '-').toLocaleLowerCase();
  if (!normalized || normalized === 'map') return null;
  if (normalized === 'clippings') return 'source/web';
  if (normalized === 'language') return 'topic/programming-language';
  if (normalized === 'system') return 'topic/system';
  if (normalized === 'project') return null;
  if (/^(topic|source|project)\//u.test(normalized)) return normalized;
  return `topic/${normalized}`;
};

const sourceLinks = (body) => {
  const links = [];
  const pattern = /\[\[((?:private\/|\.\.\/)?(?:kindle|clipping)\/[^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
  for (const match of body.matchAll(pattern)) {
    const target = match[1].replace(/^\.\.\//u, 'private/').replace(/\.md$/u, '');
    links.push(`[[${target}]]`);
  }
  return unique(links);
};

const noteStatus = (body, { hasMap, hasSource }) => {
  const plain = body
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/\[\[[^\]]+\]\]/gu, '')
    .replace(/[#>*_`\-\s]/gu, '');
  const headings = body.match(/^##+\s+/gmu)?.length ?? 0;
  const links = body.match(/\[\[[^\]]+\]\]/gu)?.length ?? 0;
  if (plain.length >= 60 && hasMap && hasSource) return 'evergreen';
  if (plain.length >= 600 && headings >= 2 && links >= 2) return 'evergreen';
  if (plain.length >= 200 || links >= 2) return 'growing';
  return 'seed';
};

const inferredAliases = (title, body) => {
  const aliases = [];
  const baseTitle = title.replace(/\s*[（(][^）)]+[）)]$/u, '').trim();
  if (baseTitle && baseTitle !== title) aliases.push(baseTitle);

  if (/^[A-Za-z][A-Za-z0-9]*$/.test(title)) {
    const firstTextLine = body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#') && !line.startsWith('-'));
    const expansion = firstTextLine?.match(/^([A-Za-z][A-Za-z ]{2,})(?:。|（|\()/u)?.[1]?.trim();
    if (expansion && expansion.toLocaleLowerCase() !== title.toLocaleLowerCase())
      aliases.push(expansion);
  }
  return aliases;
};

const yamlScalar = (value) => {
  if (/^[A-Za-z0-9_./-]+$/u.test(value)) return value;
  return JSON.stringify(value);
};

const replaceProperty = (lines, key, value) => {
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  let end = start + 1;
  if (start >= 0) {
    while (end < lines.length && (/^\s/u.test(lines[end]) || lines[end] === '')) end += 1;
  }
  const replacement = Array.isArray(value)
    ? value.length > 0
      ? [`${key}:`, ...value.map((item) => `  - ${yamlScalar(item)}`)]
      : []
    : [`${key}: ${yamlScalar(value)}`];
  if (start >= 0) lines.splice(start, end - start, ...replacement);
  else if (replacement.length > 0) lines.push(...replacement);
};

const updateFrontmatter = (source, changes) => {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/u);
  const lines = match ? match[1].split('\n') : [];
  for (const [key, value] of Object.entries(changes)) replaceProperty(lines, key, value);
  const header = `---\n${lines.join('\n')}\n---\n`;
  return match ? `${header}${source.slice(match[0].length)}` : `${header}${source}`;
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const roots = {
    clipping: path.join(PRIVATE_ROOT, 'clipping'),
    kindle: path.join(PRIVATE_ROOT, 'kindle'),
    maps: path.join(PRIVATE_ROOT, 'maps'),
    notes: path.join(PRIVATE_ROOT, 'notes'),
  };
  const filesByType = Object.fromEntries(
    await Promise.all(
      Object.entries(roots).map(async ([type, root]) => [type, await collectMarkdown(root)])
    )
  );

  const parsedMaps = await Promise.all(
    filesByType.maps.map(async (filePath) => ({
      filePath,
      parsed: matter(await readFile(filePath, 'utf8')),
    }))
  );
  const tagsByNote = new Map();
  const mapsByNote = new Map();
  for (const { filePath, parsed } of parsedMaps) {
    const mapTitle = noteTitle(filePath);
    const metadata = MAP_METADATA[mapTitle] ?? {};
    const mapTags = unique([...stringList(parsed.data.tags), ...(metadata.tags ?? [])])
      .map(normalizeTag)
      .filter(Boolean);
    const linkPattern = /\[\[(?:\.\.\/notes\/|private\/notes\/)([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
    for (const match of parsed.content.matchAll(linkPattern)) {
      const title = decodeURIComponent(match[1]).replace(/\.md$/u, '').normalize('NFC');
      tagsByNote.set(title, unique([...(tagsByNote.get(title) ?? []), ...mapTags]));
      mapsByNote.set(title, unique([...(mapsByNote.get(title) ?? []), `[[${mapTitle}]]`]));
    }
  }

  const referencedSources = new Set();
  for (const filePath of [...filesByType.notes, ...filesByType.maps]) {
    const source = await readFile(filePath, 'utf8');
    for (const link of sourceLinks(matter(source).content))
      referencedSources.add(link.normalize('NFC'));
  }

  const updates = [];
  for (const [directory, files] of Object.entries(filesByType)) {
    for (const filePath of files) {
      const source = await readFile(filePath, 'utf8');
      const parsed = matter(source);
      const data = { ...parsed.data };
      const title = noteTitle(filePath);
      data.type = {
        clipping: 'clipping',
        kindle: 'book',
        maps: 'map',
        notes: 'note',
      }[directory];

      const tags = stringList(data.tags).map(normalizeTag).filter(Boolean);
      if (directory === 'clipping') tags.push('source/web');
      if (directory === 'kindle') tags.push('source/kindle');
      if (directory === 'maps') tags.push(...(MAP_METADATA[title]?.tags ?? []));
      if (directory === 'notes') tags.push(...(tagsByNote.get(title) ?? []));
      if (tags.length > 0) data.tags = unique(tags);
      else delete data.tags;

      if (directory === 'notes' || directory === 'maps') {
        const aliases = unique([
          ...stringList(data.aliases),
          ...(MAP_METADATA[title]?.aliases ?? []),
          ...inferredAliases(title, parsed.content),
        ]).filter((alias) => alias.normalize('NFC') !== title);
        if (aliases.length > 0) data.aliases = aliases;
        else delete data.aliases;
      }

      if (directory === 'notes') {
        data.maps = mapsByNote.get(title) ?? [];
        data.sources = sourceLinks(parsed.content);
        data.status = noteStatus(parsed.content, {
          hasMap: data.maps.length > 0,
          hasSource: data.sources.length > 0,
        });
      }
      if (directory === 'maps') data.status = 'active';
      if (directory === 'clipping' || directory === 'kindle') {
        const sourceLink = `[[private/${directory}/${title}]]`.normalize('NFC');
        data.status = referencedSources.has(sourceLink)
          ? 'distilled'
          : directory === 'clipping'
            ? 'unread'
            : 'reading';
      }

      const changes = { type: data.type, tags: data.tags ?? [], status: data.status };
      if (directory === 'notes') {
        changes.aliases = data.aliases ?? [];
        changes.maps = data.maps;
        changes.sources = data.sources;
      }
      if (directory === 'maps') changes.aliases = data.aliases ?? [];
      const content = updateFrontmatter(source, changes);
      if (content !== source) updates.push({ content, data, directory, filePath });
    }
  }

  const counts = Object.fromEntries(
    Object.keys(roots).map((directory) => [
      directory,
      updates.filter((update) => update.directory === directory).length,
    ])
  );
  const statusCounts = Object.fromEntries(
    Object.entries(Object.groupBy(updates, ({ data }) => data.status)).map(([status, items]) => [
      status,
      items.length,
    ])
  );
  console.log(
    JSON.stringify(
      {
        backup: path.relative(PRIVATE_ROOT, BACKUP_PATH),
        files: updates.length,
        mode: write ? 'write' : 'dry-run',
        previews: ['clipping', 'kindle'].map((directory) => {
          const update = updates.find((item) => item.directory === directory);
          return {
            directory,
            frontmatter:
              update?.content.split('\n').slice(0, directory === 'kindle' ? 24 : 16) ?? [],
          };
        }),
        sections: counts,
        status: statusCounts,
        notesWithMaps: updates.filter(
          ({ data, directory }) => directory === 'notes' && data.maps.length > 0
        ).length,
        notesWithSources: updates.filter(
          ({ data, directory }) => directory === 'notes' && data.sources.length > 0
        ).length,
        samples: updates
          .filter(({ directory }) => directory === 'notes' || directory === 'maps')
          .slice(0, 20)
          .map(({ data, filePath }) => ({
            aliases: data.aliases ?? [],
            file: path.relative(PRIVATE_ROOT, filePath),
            tags: data.tags ?? [],
            type: data.type,
          })),
      },
      null,
      2
    )
  );
  if (!write || updates.length === 0) return;
  if (await exists(BACKUP_PATH)) throw new Error(`バックアップが既に存在します: ${BACKUP_PATH}`);

  await mkdir(STAGING_ROOT, { recursive: true });
  for (const { filePath } of updates) {
    const relative = path.relative(PRIVATE_ROOT, filePath);
    const backupTarget = path.join(STAGING_ROOT, relative);
    await mkdir(path.dirname(backupTarget), { recursive: true });
    await cp(filePath, backupTarget);
  }
  await run('/usr/bin/zip', ['-Xqr', BACKUP_PATH, path.basename(STAGING_ROOT)], {
    cwd: path.dirname(STAGING_ROOT),
  });
  await run('/usr/bin/unzip', ['-tq', BACKUP_PATH]);
  await rm(STAGING_ROOT, { recursive: true });
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[enrich-obsidian-frontmatter] ${updates.length}件を更新しました`);
};

main().catch((error) => {
  console.error('[enrich-obsidian-frontmatter] 失敗しました:', error.message);
  process.exitCode = 1;
});
