export interface WriterPreflightIssue {
  label: string;
  level: 'blocker' | 'warning';
}

interface WriterPreflightSource {
  body: string;
  brokenInternalLinks: number;
  eyecatch: boolean;
  lintChecked: boolean;
  lintMessages: number;
  readerBlockers: number;
  readerWarnings: number;
  slug: string;
  tags: string;
  title: string;
}

export const createWriterPreflight = (source: WriterPreflightSource) => {
  const issues: WriterPreflightIssue[] = [];
  if (!source.title.trim()) issues.push({ label: 'タイトルがない', level: 'blocker' });
  if (!source.body.trim()) issues.push({ label: '本文がない', level: 'blocker' });
  if (!source.slug.trim()) issues.push({ label: 'スラッグがない', level: 'blocker' });
  if (source.brokenInternalLinks > 0)
    issues.push({
      label: `${source.brokenInternalLinks}件の内部リンク先が見つからない`,
      level: 'blocker',
    });
  if (source.readerBlockers > 0)
    issues.push({
      label: `読者理解に公開前の問題が${source.readerBlockers}件ある`,
      level: 'blocker',
    });
  if (!source.eyecatch) issues.push({ label: 'サムネイルがない', level: 'warning' });
  if (!source.tags.trim()) issues.push({ label: 'タグがない', level: 'warning' });
  if (!source.lintChecked) issues.push({ label: '本文をまだ校正していない', level: 'warning' });
  else if (source.lintMessages > 0)
    issues.push({ label: `校正に${source.lintMessages}件の指摘がある`, level: 'warning' });
  if (source.readerWarnings > 0)
    issues.push({
      label: `読者理解に${source.readerWarnings}件の修正推奨がある`,
      level: 'warning',
    });

  return {
    blockers: issues.filter((issue) => issue.level === 'blocker'),
    issues,
    warnings: issues.filter((issue) => issue.level === 'warning'),
  };
};
