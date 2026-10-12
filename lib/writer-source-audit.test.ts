import { describe, expect, it } from 'vitest';
import { assessWriterSource, calculateSourceRelevance } from './writer-source-audit';

const input = {
  claim: 'Next.jsのキャッシュは明示的に再検証できる。',
  claimOffset: 24,
  url: 'https://nextjs.org/docs/cache',
};

describe('writer source audit', () => {
  it('主張と出典内容の関連度を評価する', () => {
    const relevant = calculateSourceRelevance(input.claim, {
      finalUrl: input.url,
      statusCode: 200,
      text: 'Next.jsではキャッシュをタグによって明示的に再検証できます。',
      title: 'キャッシュと再検証',
    });
    const unrelated = calculateSourceRelevance(input.claim, {
      finalUrl: input.url,
      statusCode: 200,
      text: '週末に作るパスタのレシピを紹介します。',
      title: '料理の記事',
    });

    expect(relevant).toBeGreaterThan(unrelated);
    expect(relevant).toBeGreaterThan(0.18);
  });

  it('取得失敗、古さ、関連性の弱さを区別する', () => {
    expect(assessWriterSource(input, null).status).toBe('broken');
    const result = assessWriterSource(
      input,
      {
        finalUrl: input.url,
        publishedAt: '2020-01-01',
        statusCode: 200,
        text: '料理の記事です。',
        title: '料理の記事',
      },
      new Date('2026-10-07T00:00:00Z')
    );
    expect(result.status).toBe('warning');
    expect(result.issues).toContain('主張との関連が弱い');
    expect(result.issues).toContain('公開から6年経過');
  });
});
