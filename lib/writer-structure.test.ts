import { describe, expect, it } from 'vitest';
import { analyzeWriterStructure } from './writer-structure';

describe('analyzeWriterStructure', () => {
  it('章ごとの主張・根拠・進捗と次に書く章を抽出する', () => {
    const body = `## この記事で扱うこと

設計判断を再現可能にする方法を説明する。

## 判断基準

判断基準はチームで共有できなければ意味がない。[[private/notes/decision|判断の記録]]を基に、採用条件を具体化する。

## まとめ

`;
    const result = analyzeWriterStructure(body);

    expect(result.sections[1]).toMatchObject({
      claim: '判断基準はチームで共有できなければ意味がない。',
      evidence: [{ label: '判断の記録', target: 'private/notes/decision', type: 'note' }],
      heading: '判断基準',
    });
    expect(result.nextSection?.heading).toBe('まとめ');
    expect(result.nextSection?.nextAction).toContain('結論');
  });

  it('導入・結論・根拠・具体例の不足を検出する', () => {
    const body = `## 設計原則

設計原則は重要であり、状況に合わせて適切に利用する必要がある。これはチームの認識を揃え、長期的な保守性を高めるための基礎になる。さらに変更時の判断を安定させ、関係者間の認識差を減らす役割も持つ。十分な説明を加えて運用に組み込むことで、組織全体の設計品質を継続的に改善できる。

## 注意点

短い説明。`;
    const result = analyzeWriterStructure(body);

    expect(result.gaps.map((gap) => gap.text)).toEqual(
      expect.arrayContaining([
        '冒頭で読者の課題と記事の結論を示す',
        '最後に結論と読者が次に取る行動を置く',
        '「設計原則」に根拠を結ぶ',
        '「設計原則」に具体例を足す',
      ])
    );
  });
});
