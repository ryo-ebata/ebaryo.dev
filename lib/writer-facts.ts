export type WriterClaimKind = 'assertion' | 'experience' | 'measurement' | 'opinion';
export type WriterClaimStatus = 'grounded' | 'needs-evidence' | 'personal';
export type WriterReaderMode = 'intermediate' | 'practitioner' | 'skeptic' | 'skimmer';

export interface WriterClaim {
  evidence: string[];
  insertionOffset: number;
  kind: WriterClaimKind;
  offset: number;
  questions: string[];
  status: WriterClaimStatus;
  text: string;
}

export interface WriterEditorialFinding {
  offset?: number;
  text: string;
}

export interface WriterFactAnalysis {
  claims: WriterClaim[];
  groundedCount: number;
  needsEvidenceCount: number;
  readerReviews: Record<WriterReaderMode, WriterEditorialFinding[]>;
  researchTasks: WriterResearchTask[];
}

export interface WriterResearchTask {
  offset: number;
  text: string;
  type: 'clarify' | 'source';
}

const collectEvidence = (text: string) => [
  ...new Set([
    ...[...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/gu)].map((match) => match[1]),
    ...[...text.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/gu)].map((match) => match[1]),
  ]),
];

const plainText = (text: string) =>
  text
    .replace(/<!--[\s\S]*?-->/gu, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, '$2 $1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/[*_~`]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();

const classifyClaim = (text: string): WriterClaimKind => {
  if (/(?:\d[\d,.]*(?:%|％|倍|件|秒|分|時間|日|KB|MB|GB|px)|v\d)/u.test(text)) return 'measurement';
  if (/(?:試した|実装した|使った|確認した|遭遇した|発生した|測定した|検証した)/u.test(text))
    return 'experience';
  if (/(?:筆者の見解|と思う|と考える|個人的|私(?:は|の)|べきだ)/u.test(text)) return 'opinion';
  return 'assertion';
};

const specificityQuestions = (text: string, kind: WriterClaimKind, hasEvidence: boolean) => {
  const questions: string[] = [];
  if (/(?:大幅|劇的|効率的|高速|向上|改善|最適)/u.test(text))
    questions.push('何と比較し、何がどれだけ変わったのか？');
  if (/(?:簡単|容易|柔軟|適切|さまざま|多くの)/u.test(text))
    questions.push('誰にとって、どの条件でそう言えるのか？');
  if (/(?:必ず|絶対|すべて|常に|誰でも)/u.test(text))
    questions.push('成立しない例外や前提条件はないか？');
  if (kind === 'measurement' && !hasEvidence)
    questions.push('この数字は実測・目標・体感・引用のどれか？');
  return questions;
};

const extractParagraphs = (body: string) => {
  const paragraphs: Array<{ insertionOffset: number; offset: number; raw: string }> = [];
  const lines = body.split('\n');
  let offset = 0;
  let start = 0;
  let end = 0;
  let buffer: string[] = [];
  let inCode = false;
  const flush = () => {
    if (buffer.length > 0)
      paragraphs.push({ insertionOffset: end, offset: start, raw: buffer.join(' ') });
    buffer = [];
  };
  for (const line of lines) {
    if (/^\s*```/u.test(line)) {
      flush();
      inCode = !inCode;
    } else if (!inCode && !line.trim()) flush();
    else if (!inCode && !/^\s*(?:#{1,6}|[-*+] |\d+\. |>|<!--)/u.test(line)) {
      if (buffer.length === 0) start = offset;
      buffer.push(line.trim());
      end = offset + line.length;
    }
    offset += line.length + 1;
  }
  flush();
  return paragraphs;
};

const readerReviews = (
  title: string,
  body: string,
  claims: WriterClaim[]
): Record<WriterReaderMode, WriterEditorialFinding[]> => {
  const unsupported = claims.filter((claim) => claim.status === 'needs-evidence');
  const headings = [...body.matchAll(/^#{2,6}\s+(.+)$/gmu)].map((match) => ({
    offset: match.index,
    text: match[1].trim(),
  }));
  const skeptic: WriterEditorialFinding[] = unsupported.slice(0, 4).map((claim) => ({
    offset: claim.offset,
    text: `「${claim.text.slice(0, 48)}」を裏付ける根拠がない`,
  }));
  if (!/(?:失敗|制約|限界|例外|向かない|注意)/u.test(body))
    skeptic.push({ text: '成功条件だけでなく、成立しない条件も書く' });
  if (/(?:完全|最強|必ず|絶対)/u.test(title))
    skeptic.push({ text: 'タイトルの強い断定を本文で証明できているか確認する' });

  const intermediate: WriterEditorialFinding[] = [];
  const acronym = /\b[A-Z][A-Z0-9]{2,}\b/u.exec(plainText(body));
  if (acronym)
    intermediate.push({ offset: acronym.index, text: `${acronym[0]}を初出時に説明する` });
  if (!/(?:例えば|具体例|実際|ケース|```)/u.test(body))
    intermediate.push({ text: '概念を理解できる具体例を一つ置く' });
  if (unsupported.length > 0)
    intermediate.push({ offset: unsupported[0].offset, text: '判断基準の理由を根拠と結び付ける' });

  const practitioner: WriterEditorialFinding[] = [];
  if (!/(?:手順|まず|次に|最後に|```|\d+\.)/u.test(body))
    practitioner.push({ text: '読者が再現できる手順かコードを追加する' });
  if (!/(?:環境|バージョン|前提|対象)/u.test(body))
    practitioner.push({ text: '適用できる環境と前提条件を明記する' });
  if (!/(?:結果|確認|出力|ログ|スクリーンショット)/u.test(body))
    practitioner.push({ text: '成功を判断できる結果を示す' });

  const skimmer: WriterEditorialFinding[] = [];
  if (headings.length < 2) skimmer.push({ text: '見出しだけで論旨を追える構造に分ける' });
  const vagueHeading = headings.find(({ text }) => /^(?:概要|詳細|その他|補足|考察)$/u.test(text));
  if (vagueHeading)
    skimmer.push({
      offset: vagueHeading.offset,
      text: `「${vagueHeading.text}」を結論が分かる見出しへ変える`,
    });
  if (!/(?:まとめ|結論|おわり|次に)/u.test(headings.at(-1)?.text ?? ''))
    skimmer.push({ text: '最後の見出しで結論か次の行動を明示する' });

  return { intermediate, practitioner, skeptic, skimmer };
};

export const analyzeWriterFacts = (title: string, body: string): WriterFactAnalysis => {
  const claims = extractParagraphs(body)
    .map(({ insertionOffset, offset, raw }): WriterClaim | null => {
      const text =
        plainText(raw)
          .split(/(?<=[。！？!?])\s*/u)[0]
          ?.trim() ?? '';
      if (text.length < 12) return null;
      const evidence = collectEvidence(raw);
      const kind = classifyClaim(text);
      const status: WriterClaimStatus =
        evidence.length > 0
          ? 'grounded'
          : kind === 'opinion' || kind === 'experience'
            ? 'personal'
            : 'needs-evidence';
      return {
        evidence,
        insertionOffset,
        kind,
        offset,
        questions: specificityQuestions(text, kind, evidence.length > 0),
        status,
        text,
      };
    })
    .filter((claim): claim is WriterClaim => claim !== null);
  const researchTasks = claims.flatMap((claim): WriterResearchTask[] => [
    ...(claim.status === 'needs-evidence'
      ? [
          {
            offset: claim.offset,
            text:
              claim.kind === 'measurement'
                ? `数字の出所を確認: ${claim.text}`
                : `根拠を探す: ${claim.text}`,
            type: 'source' as const,
          },
        ]
      : []),
    ...claim.questions.map((question) => ({
      offset: claim.offset,
      text: `「${claim.text.slice(0, 32)}」を具体化: ${question}`,
      type: 'clarify' as const,
    })),
  ]);
  return {
    claims,
    groundedCount: claims.filter((claim) => claim.status === 'grounded').length,
    needsEvidenceCount: claims.filter((claim) => claim.status === 'needs-evidence').length,
    readerReviews: readerReviews(title, body, claims),
    researchTasks,
  };
};
