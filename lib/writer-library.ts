export type WriterLifecycleStage = 'idea' | 'published' | 'review' | 'writing';
export type WriterMaintenanceIssue =
  | 'broken-link'
  | 'missing-eyecatch'
  | 'missing-tags'
  | 'orphaned'
  | 'short-content'
  | 'stale';

export interface WriterLibrarySource {
  body: string;
  description: string;
  draft: boolean;
  eyecatch: boolean;
  slug: string;
  tags: string[];
  title: string;
  updatedAt: string;
}

export interface WriterLibraryStatus {
  issueDetails: Partial<Record<WriterMaintenanceIssue, string>>;
  issues: WriterMaintenanceIssue[];
  progress: number;
  stage: WriterLifecycleStage;
}

const extractLinkedSlugs = (body: string) =>
  new Set(
    [...body.matchAll(/(?:\/blog\/|https?:\/\/[^\s)]+\/blog\/)([a-z0-9]+(?:-[a-z0-9]+)*)/gu)].map(
      (match) => match[1]
    )
  );

export const analyzeWriterLibrary = (
  articles: WriterLibrarySource[],
  now = new Date()
): Map<string, WriterLibraryStatus> => {
  const knownSlugs = new Set(articles.map((article) => article.slug));
  const inboundLinks = new Map<string, number>();
  const linkedByArticle = new Map<string, Set<string>>();

  for (const article of articles) {
    const links = extractLinkedSlugs(article.body);
    linkedByArticle.set(article.slug, links);
    for (const slug of links) {
      if (slug === article.slug || !knownSlugs.has(slug)) continue;
      inboundLinks.set(slug, (inboundLinks.get(slug) ?? 0) + 1);
    }
  }

  return new Map(
    articles.map((article) => {
      const characterCount = article.body.replace(/\s/gu, '').length;
      const progress = Math.min(
        100,
        (article.title.trim() ? 15 : 0) +
          (characterCount >= 800 ? 45 : characterCount >= 200 ? 25 : characterCount > 0 ? 10 : 0) +
          (article.description.trim() ? 10 : 0) +
          (article.tags.length > 0 ? 15 : 0) +
          (article.eyecatch ? 15 : 0)
      );
      const stage: WriterLifecycleStage = article.draft
        ? characterCount < 200
          ? 'idea'
          : characterCount < 800
            ? 'writing'
            : 'review'
        : 'published';
      const issues: WriterMaintenanceIssue[] = [];
      const issueDetails: Partial<Record<WriterMaintenanceIssue, string>> = {};

      if (!article.draft) {
        const updatedAt = new Date(article.updatedAt).getTime();
        if (Number.isFinite(updatedAt) && now.getTime() - updatedAt >= 365 * 24 * 60 * 60 * 1000) {
          issues.push('stale');
          issueDetails.stale = `最終更新が${new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(new Date(updatedAt))}で、1年以上経過している`;
        }
        if (!article.eyecatch) {
          issues.push('missing-eyecatch');
          issueDetails['missing-eyecatch'] = 'サムネイル画像が設定されていない';
        }
        if (article.tags.length === 0) {
          issues.push('missing-tags');
          issueDetails['missing-tags'] = '分類に使うタグが1件も設定されていない';
        }
        if (characterCount < 600) {
          issues.push('short-content');
          issueDetails['short-content'] =
            `本文が${characterCount.toLocaleString('ja-JP')}文字で、目安の600文字に届いていない`;
        }
        if (articles.length > 1 && (inboundLinks.get(article.slug) ?? 0) === 0) {
          issues.push('orphaned');
          issueDetails.orphaned = 'ほかの記事からこの記事への内部リンクがない';
        }
        const brokenLinks = [...(linkedByArticle.get(article.slug) ?? [])].filter(
          (slug) => !knownSlugs.has(slug)
        );
        if (brokenLinks.length > 0) {
          issues.push('broken-link');
          issueDetails['broken-link'] =
            `存在しない記事へのリンク: ${brokenLinks.map((slug) => `/blog/${slug}`).join('、')}`;
        }
      }

      return [article.slug, { issueDetails, issues, progress, stage }];
    })
  );
};
