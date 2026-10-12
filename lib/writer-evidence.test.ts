import { describe, expect, it } from 'vitest';
import type { WriterClaim } from './writer-facts';
import { suggestWriterEvidence } from './writer-evidence';

const claim: WriterClaim = {
  evidence: [],
  insertionOffset: 20,
  kind: 'assertion',
  offset: 0,
  questions: [],
  status: 'needs-evidence',
  text: 'チーム設計では認知負荷を減らす必要がある。',
};

describe('suggestWriterEvidence', () => {
  it('主張との関連度で並べて資料の役割を分類する', () => {
    const result = suggestWriterEvidence(claim, [
      {
        description: '認知負荷を減らすチーム設計の実践事例',
        id: 'example',
        insertText: '[[example]]',
        sourceType: 'note',
        title: 'チーム設計の実践',
      },
      {
        description: 'チーム設計が失敗する条件と限界',
        id: 'counter',
        insertText: '[[counter]]',
        sourceType: 'clipping',
        title: '認知負荷への反論',
      },
      {
        description: '無関係な料理の話',
        id: 'other',
        insertText: '[[other]]',
        sourceType: 'note',
        title: '夕食',
      },
    ]);

    expect(result.map((item) => item.id)).not.toContain('other');
    expect(result.find((item) => item.id === 'example')?.role).toBe('example');
    expect(result.find((item) => item.id === 'counter')?.role).toBe('counterpoint');
  });
});
