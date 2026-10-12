import { describe, expect, it } from 'vitest';
import { analyzeWriterFacts } from './writer-facts';

describe('analyzeWriterFacts', () => {
  it('主張を分類して根拠状態と具体化質問を作る', () => {
    const result = analyzeWriterFacts(
      '検証記事',
      `## 結果

処理時間は50%改善した。

公式資料によると、このAPIはNode.jsで利用できる。[公式資料](https://example.com/docs)

実際に三つの環境で試した。`
    );

    expect(result.claims[0]).toMatchObject({
      kind: 'measurement',
      status: 'needs-evidence',
    });
    expect(result.claims[0].questions).toContain('この数字は実測・目標・体感・引用のどれか？');
    expect(result.claims[1]).toMatchObject({
      evidence: ['https://example.com/docs'],
      status: 'grounded',
    });
    expect(result.claims[2]).toMatchObject({ kind: 'experience', status: 'personal' });
    expect(result.researchTasks.map((task) => task.text).join(' ')).toContain('数字の出所を確認');
  });

  it('読者ごとに異なる不足を返す', () => {
    const result = analyzeWriterFacts(
      '完全な設計方法',
      `## 概要

この方法は常に効率的である。`
    );

    expect(result.readerReviews.skeptic.map((finding) => finding.text).join(' ')).toContain(
      '根拠がない'
    );
    expect(result.readerReviews.practitioner.map((finding) => finding.text)).toContain(
      '適用できる環境と前提条件を明記する'
    );
    expect(result.readerReviews.skimmer.map((finding) => finding.text).join(' ')).toContain('概要');
  });

  it('見解と明示した主張を本人の知見として扱う', () => {
    const result = analyzeWriterFacts(
      '見解記事',
      '筆者の見解では、この設計が長期運用に最も適している。'
    );

    expect(result.claims[0]).toMatchObject({ kind: 'opinion', status: 'personal' });
    expect(result.needsEvidenceCount).toBe(0);
  });
});
