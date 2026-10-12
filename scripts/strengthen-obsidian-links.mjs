#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

const NOTES_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'notes'
);
const WRITE_FLAG = '--write';
const START_MARKER = '<!-- related-notes:start -->';
const END_MARKER = '<!-- related-notes:end -->';
const MIN_CONNECTIONS = 2;
const MAX_CONNECTIONS = 4;
const CURATED_CONNECTIONS = [
  ['Atlas（H）', 'プロジェクトの成果（アウトプット）', '成果を捉える具体例'],
  ['Golang', 'Java仮想マシン', '実行方式を比較'],
  ['PERMA理論', '満足度と幸福度', 'ウェルビーイングの構成要素'],
  ['Right Hand', 'Tech Lead', 'スタッフエンジニアの役割'],
  ['Solver', 'Tech Lead', 'スタッフエンジニアの役割'],
  ['アクティビティ', '効率と流れ', 'SPACEの異なる観点'],
  ['Expand and Contract', 'キャラクタライゼーションテスト', '安全な変更を支える手法'],
  ['コミュニケーションと協働', 'チームAPI', 'チーム間協働を設計'],
  ['スタック', 'Java仮想マシン', '実行時に使われるデータ構造'],
  ['Codex', 'キャラクタライゼーションテスト', 'コード変更を安全に進める'],
];
const curatedReasons = new Map(
  CURATED_CONNECTIONS.flatMap(([left, right, reason]) => [
    [`${left}\0${right}`, reason],
    [`${right}\0${left}`, reason],
  ])
);

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const targetName = (value) =>
  String(value)
    .replace(/^\[\[/u, '')
    .replace(/\]\]$/u, '')
    .split('|')[0]
    .split('#')[0]
    .split('/')
    .at(-1)
    ?.trim();
const relationValues = (value) =>
  new Set(
    asList(value)
      .map(targetName)
      .filter((item) => item?.length > 0)
  );
const noteTargets = (content) =>
  new Set(
    [...content.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/gu)]
      .map((match) => targetName(match[1]))
      .filter(Boolean)
  );
const withoutManagedSection = (content) => {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start < 0 || end < start) return content;
  return `${content.slice(0, start)}${content.slice(end + END_MARKER.length)}`;
};
const intersection = (left, right) => [...left].filter((value) => right.has(value));

const describeRelation = (left, right) => {
  const curated = curatedReasons.get(`${left.name}\0${right.name}`);
  if (curated) return curated;
  const maps = intersection(left.maps, right.maps);
  if (maps.length > 0) return `「${maps[0]}」の論点`;
  const sources = intersection(left.sources, right.sources);
  if (sources.length > 0) return `同じ出典「${sources[0]}」から展開`;
  const tags = intersection(left.tags, right.tags);
  return tags.length > 0 ? `#${tags[0]} で関連` : '本文から直接関連';
};

const relationScore = (left, right) => {
  const sharedMaps = intersection(left.maps, right.maps).length;
  const sharedSources = intersection(left.sources, right.sources).length;
  const sharedTags = intersection(left.tags, right.tags).length;
  const mentions =
    (left.body.includes(right.name) ? 1 : 0) + (right.body.includes(left.name) ? 1 : 0);
  return sharedMaps * 12 + sharedSources * 8 + sharedTags * 5 + mentions * 10;
};

const renderSection = (note, relatedByName) => {
  const related = [...(relatedByName.get(note.name) ?? [])]
    .map((name) => note.byName.get(name))
    .filter(Boolean)
    .sort(
      (left, right) =>
        relationScore(note, right) - relationScore(note, left) ||
        left.name.localeCompare(right.name)
    )
    .slice(0, MAX_CONNECTIONS);
  if (related.length === 0) return '';
  return `${START_MARKER}\n${related
    .map(
      (candidate) =>
        `- [[${candidate.name.normalize('NFC')}]] — ${describeRelation(note, candidate)}`
    )
    .join('\n')}\n${END_MARKER}`;
};

const replaceManagedSection = (content, section) => {
  const managedPattern = new RegExp(
    `${START_MARKER.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}[\\s\\S]*?${END_MARKER.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`,
    'u'
  );
  if (managedPattern.test(content)) return content.replace(managedPattern, section);
  return `${content.trimEnd()}\n\n## 関連ノート\n\n${section}\n`;
};

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const names = (await readdir(NOTES_ROOT))
    .filter((name) => name.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right, 'ja'));
  const notes = await Promise.all(
    names.map(async (filename) => {
      const filePath = path.join(NOTES_ROOT, filename);
      const raw = await readFile(filePath, 'utf8');
      const parsed = matter(raw);
      return {
        body: parsed.content,
        existingTargets: noteTargets(withoutManagedSection(raw)),
        filePath,
        maps: relationValues(parsed.data.maps),
        name: path.basename(filename, '.md'),
        raw,
        sources: relationValues(parsed.data.sources),
        tags: new Set(
          asList(parsed.data.tags)
            .map(String)
            .filter((tag) => tag.startsWith('topic/'))
        ),
      };
    })
  );
  const byName = new Map(notes.map((note) => [note.name, note]));
  for (const note of notes) note.byName = byName;

  const existing = new Map(
    notes.map((note) => [
      note.name,
      new Set(
        [...note.existingTargets].filter((target) => target !== note.name && byName.has(target))
      ),
    ])
  );
  const relatedByName = new Map(notes.map((note) => [note.name, new Set(existing.get(note.name))]));
  for (const note of notes) {
    for (const target of existing.get(note.name)) relatedByName.get(target)?.add(note.name);
  }
  for (const [left, right] of CURATED_CONNECTIONS) {
    if (!byName.has(left) || !byName.has(right))
      throw new Error(`手動接続先が存在しません: ${left} -> ${right}`);
    relatedByName.get(left).add(right);
    relatedByName.get(right).add(left);
  }

  const candidates = notes.flatMap((left, index) =>
    notes.slice(index + 1).flatMap((right) => {
      const score = relationScore(left, right);
      return score >= 5 ? [{ left: left.name, right: right.name, score }] : [];
    })
  );
  candidates.sort(
    (first, second) =>
      second.score - first.score ||
      first.left.localeCompare(second.left, 'ja') ||
      first.right.localeCompare(second.right, 'ja')
  );

  for (const note of notes) {
    const connections = relatedByName.get(note.name);
    while (connections.size < MIN_CONNECTIONS) {
      const candidate = candidates.find(
        ({ left, right }) =>
          (left === note.name || right === note.name) &&
          !connections.has(left === note.name ? right : left) &&
          relatedByName.get(left).size < MAX_CONNECTIONS &&
          relatedByName.get(right).size < MAX_CONNECTIONS
      );
      if (!candidate) break;
      relatedByName.get(candidate.left).add(candidate.right);
      relatedByName.get(candidate.right).add(candidate.left);
    }
  }

  const updates = [];
  for (const note of notes) {
    const section = renderSection(note, relatedByName);
    if (!section) continue;
    const content = replaceManagedSection(note.raw, section);
    if (content !== note.raw) updates.push({ content, filePath: note.filePath, name: note.name });
  }

  const degree = (graph, note) => graph.get(note.name)?.size ?? 0;
  const report = {
    connectedNotesAfter: notes.filter((note) => degree(relatedByName, note) > 0).length,
    connectedNotesBefore: notes.filter((note) => degree(existing, note) > 0).length,
    filesModified: updates.length,
    isolatedNotesAfter: notes
      .filter((note) => degree(relatedByName, note) === 0)
      .map(({ name }) => name),
    isolatedNotesBefore: notes.filter((note) => degree(existing, note) === 0).length,
    linksAfter: [...relatedByName.values()].reduce((sum, links) => sum + links.size, 0),
    linksBefore: [...existing.values()].reduce((sum, links) => sum + links.size, 0),
    mode: write ? 'write' : 'dry-run',
    sample: updates.slice(0, 12).map(({ name }) => ({
      links: [...relatedByName.get(name)],
      note: name,
    })),
    totalNotes: notes.length,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[strengthen-obsidian-links] ${updates.length}件のノートを更新しました`);
};

main().catch((error) => {
  console.error('[strengthen-obsidian-links] 失敗しました:', error.message);
  process.exitCode = 1;
});
