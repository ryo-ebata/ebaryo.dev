export type WriterSourceAuditStatus = 'broken' | 'healthy' | 'warning';

export interface WriterSourceAuditInput {
  claim: string;
  claimOffset: number;
  url: string;
}

export interface WriterSourceSnapshot {
  author?: string;
  description?: string;
  finalUrl: string;
  publishedAt?: string;
  statusCode: number;
  text?: string;
  title?: string;
}

export interface WriterSourceAuditResult extends WriterSourceAuditInput {
  author?: string;
  finalUrl?: string;
  issues: string[];
  publishedAt?: string;
  relevance?: number;
  status: WriterSourceAuditStatus;
  statusCode?: number;
  title?: string;
}

const bigrams = (value: string) => {
  const normalized = value
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/https?:\/\/\S+/gu, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '');
  const result = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1)
    result.add(normalized.slice(index, index + 2));
  return result;
};

export const calculateSourceRelevance = (claim: string, snapshot: WriterSourceSnapshot) => {
  const claimTerms = bigrams(claim);
  if (claimTerms.size === 0) return 0;
  const titleTerms = bigrams(`${snapshot.title ?? ''} ${snapshot.description ?? ''}`);
  const bodyTerms = bigrams(snapshot.text ?? '');
  let score = 0;
  for (const term of claimTerms) {
    if (titleTerms.has(term)) score += 2;
    else if (bodyTerms.has(term)) score += 1;
  }
  return Math.min(1, score / claimTerms.size);
};

const ageInYears = (date: string, now: Date) => {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return undefined;
  return (now.getTime() - timestamp) / (365.25 * 24 * 60 * 60 * 1000);
};

export const assessWriterSource = (
  input: WriterSourceAuditInput,
  snapshot: WriterSourceSnapshot | null,
  now = new Date()
): WriterSourceAuditResult => {
  if (!snapshot || snapshot.statusCode >= 400) {
    return {
      ...input,
      finalUrl: snapshot?.finalUrl,
      issues: ['ページを取得できない'],
      status: 'broken',
      statusCode: snapshot?.statusCode,
    };
  }

  const relevance = calculateSourceRelevance(input.claim, snapshot);
  const issues: string[] = [];
  if (relevance < 0.18) issues.push('主張との関連が弱い');
  const age = snapshot.publishedAt ? ageInYears(snapshot.publishedAt, now) : undefined;
  if (age !== undefined && age >= 3) issues.push(`公開から${Math.floor(age)}年経過`);
  try {
    if (new URL(input.url).hostname !== new URL(snapshot.finalUrl).hostname)
      issues.push('別ドメインへ転送された');
  } catch {
    issues.push('転送先を確認できない');
  }

  return {
    ...input,
    author: snapshot.author,
    finalUrl: snapshot.finalUrl,
    issues,
    publishedAt: snapshot.publishedAt,
    relevance,
    status: issues.length > 0 ? 'warning' : 'healthy',
    statusCode: snapshot.statusCode,
    title: snapshot.title,
  };
};
