import { describe, expect, it } from 'vitest';
import { analyzeWriterVoice, createWriterVoiceProfile } from './writer-voice';

describe('writer voice', () => {
  it('文章の基準値を計算する', () => {
    const profile = createWriterVoiceProfile(
      '短い文です。こちらは少し長い説明文です。最後の文です。'
    );
    expect(profile.sentenceCount).toBe(3);
    expect(profile.averageSentenceLength).toBeGreaterThan(0);
    expect(profile.sentenceLengthVariation).toBeGreaterThan(0);
  });

  it('過去記事との差とAI的な定型表現を検出する', () => {
    const body = `${'これは非常に長い説明を意図的に続けて一文へ多くの情報を詰め込んでいる文章です。'.repeat(6)}重要です。`;
    const result = analyzeWriterVoice(body, {
      averageSentenceLength: 15,
      bulletRatio: 0,
      sentenceCount: 100,
      sentenceLengthVariation: 0.5,
    });
    expect(result.findings.map((finding) => finding.text).join(' ')).toContain(
      '過去記事より一文が長い'
    );
    expect(result.findings.map((finding) => finding.text).join(' ')).toContain('「重要です」');
  });
});
