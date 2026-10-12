export interface WriterVoiceProfile {
  averageSentenceLength: number;
  bulletRatio: number;
  sentenceCount: number;
  sentenceLengthVariation: number;
}

export interface WriterVoiceFinding {
  offset?: number;
  text: string;
  type: 'ai-pattern' | 'voice';
}

export interface WriterVoiceAnalysis {
  baseline?: WriterVoiceProfile;
  findings: WriterVoiceFinding[];
  profile: WriterVoiceProfile;
}

const normalizeBody = (body: string) =>
  body
    .replace(/<!--[\s\S]*?-->/gu, '')
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/^#{1,6}\s+.+$/gmu, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/gu, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu, '$2 $1');

const coefficientOfVariation = (values: number[]) => {
  if (values.length === 0) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance) / average;
};

export const createWriterVoiceProfile = (body: string): WriterVoiceProfile => {
  const normalized = normalizeBody(body);
  const sentences = normalized
    .split(/[。！？!?]+/u)
    .map((sentence) => sentence.replace(/\s+/gu, '').trim())
    .filter((sentence) => sentence.length >= 4);
  const lengths = sentences.map((sentence) => sentence.length);
  const contentLines = normalized.split('\n').filter((line) => line.trim());
  const bulletLines = contentLines.filter((line) => /^\s*(?:[-*+] |\d+\. )/u.test(line));
  return {
    averageSentenceLength:
      lengths.length === 0
        ? 0
        : Math.round(lengths.reduce((sum, length) => sum + length, 0) / lengths.length),
    bulletRatio: contentLines.length === 0 ? 0 : bulletLines.length / contentLines.length,
    sentenceCount: sentences.length,
    sentenceLengthVariation: coefficientOfVariation(lengths),
  };
};

const genericPhrases = [
  '重要です',
  '効果的です',
  '非常に重要',
  'さまざまな',
  '多くの場合',
  'することができます',
  '以下の通りです',
];

export const analyzeWriterVoice = (
  body: string,
  baseline?: WriterVoiceProfile
): WriterVoiceAnalysis => {
  const profile = createWriterVoiceProfile(body);
  const findings: WriterVoiceFinding[] = [];
  if (baseline && baseline.sentenceCount >= 20 && profile.sentenceCount >= 5) {
    if (profile.averageSentenceLength > baseline.averageSentenceLength * 1.35)
      findings.push({ text: '過去記事より一文が長い。情報を二文へ分ける', type: 'voice' });
    else if (profile.averageSentenceLength < baseline.averageSentenceLength * 0.65)
      findings.push({ text: '過去記事より短文が多い。文同士の関係を明示する', type: 'voice' });
    if (profile.bulletRatio > baseline.bulletRatio + 0.2)
      findings.push({
        text: '過去記事より箇条書きが多い。説明すべき関係を文章へ戻す',
        type: 'voice',
      });
  }
  if (profile.sentenceCount >= 8 && profile.sentenceLengthVariation < 0.24)
    findings.push({ text: '文の長さが均一すぎる。要点に応じてリズムを変える', type: 'ai-pattern' });

  for (const phrase of genericPhrases) {
    const offset = body.indexOf(phrase);
    if (offset >= 0)
      findings.push({
        offset,
        text: `「${phrase}」を具体的な効果・条件・数値へ置き換える`,
        type: 'ai-pattern',
      });
  }

  const sections = body
    .split(/^#{2,6}\s+.+$/gmu)
    .map((section) => normalizeBody(section).replace(/\s/gu, '').length)
    .filter((length) => length >= 40);
  if (sections.length >= 4 && coefficientOfVariation(sections) < 0.18)
    findings.push({
      text: '各章の長さが均一すぎる。重要度に応じて濃淡を付ける',
      type: 'ai-pattern',
    });

  return { baseline, findings, profile };
};
