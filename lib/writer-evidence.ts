import type { WriterClaim } from './writer-facts';

export type WriterEvidenceRole = 'counterpoint' | 'definition' | 'example' | 'support';
export type WriterEvidenceSourceType = 'article' | 'clipping' | 'kindle' | 'note';

export interface WriterEvidenceSource {
  description: string;
  id: string;
  insertText: string;
  sourceType: WriterEvidenceSourceType;
  title: string;
}

export interface WriterEvidenceSuggestion extends WriterEvidenceSource {
  role: WriterEvidenceRole;
  score: number;
}

const terms = (value: string) => {
  const normalized = value.normalize('NFKC').toLocaleLowerCase('ja');
  const words = normalized.split(/[\s、。・,./:;!?()[\]{}「」『』【】]+/u).filter(Boolean);
  const result = new Set(words.filter((word) => word.length >= 2));
  for (const word of words) {
    if (!/[ぁ-んァ-ヶ一-龠]/u.test(word) || word.length < 3) continue;
    for (let index = 0; index < word.length - 1; index += 1)
      result.add(word.slice(index, index + 2));
  }
  return result;
};

const roleFor = (source: WriterEvidenceSource): WriterEvidenceRole => {
  const text = `${source.title} ${source.description}`;
  if (/(?:反対|反論|一方|しかし|失敗|限界|向かない|問題)/u.test(text)) return 'counterpoint';
  if (/(?:とは|定義|意味|概念|原則)/u.test(text)) return 'definition';
  if (/(?:事例|実例|ケース|実践|試した|やってみた)/u.test(text)) return 'example';
  return 'support';
};

export const suggestWriterEvidence = (
  claim: WriterClaim,
  sources: WriterEvidenceSource[],
  limit = 3
): WriterEvidenceSuggestion[] => {
  const claimTerms = terms(claim.text);
  return sources
    .map((source) => {
      const titleTerms = terms(source.title);
      const descriptionTerms = terms(source.description);
      const titleMatches = [...titleTerms].filter((term) => claimTerms.has(term)).length;
      const descriptionMatches = [...descriptionTerms].filter((term) =>
        claimTerms.has(term)
      ).length;
      return { ...source, role: roleFor(source), score: titleMatches * 3 + descriptionMatches };
    })
    .filter((source) => source.score >= 2 && !claim.evidence.includes(source.id))
    .sort(
      (first, second) => second.score - first.score || first.title.localeCompare(second.title, 'ja')
    )
    .slice(0, limit);
};

export const suggestEvidenceForClaims = (
  claims: WriterClaim[],
  sources: WriterEvidenceSource[]
): Record<number, WriterEvidenceSuggestion[]> =>
  Object.fromEntries(claims.map((claim) => [claim.offset, suggestWriterEvidence(claim, sources)]));
