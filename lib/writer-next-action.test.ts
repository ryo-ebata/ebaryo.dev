import { describe, expect, it } from 'vitest';
import { analyzeWriterDraft } from './writer-analysis';
import { analyzeWriterFacts } from './writer-facts';
import { createWriterNextAction } from './writer-next-action';
import { analyzeWriterVoice } from './writer-voice';

const decide = (title: string, body: string, lintCount = 0) =>
  createWriterNextAction({
    analysis: analyzeWriterDraft(title, body),
    facts: analyzeWriterFacts(title, body),
    lintCount,
    title,
    voice: analyzeWriterVoice(body),
  });

describe('createWriterNextAction', () => {
  it('読者理解のblockerを未完成の章より先に直す', () => {
    const action = decide(
      '記事タイトル',
      `### 実装

`
    );
    expect(action).toMatchObject({
      label: '最初の見出し「実装」がH3から始まっている',
      panel: 'analysis',
      reason: '読者理解を妨げる問題',
    });
  });

  it('未完成の章を根拠不足より先に進める', () => {
    const action = decide(
      '記事タイトル',
      `## 結論

この方法は必ず効率的である。

## 実装
`
    );
    expect(action).toMatchObject({ label: 'この章で伝える結論を書く', panel: 'analysis' });
  });

  it('本文が書けたら根拠不足の主張を優先する', () => {
    const action = decide(
      '記事タイトル',
      `## 結論

この方法は必ず効率的であり、導入すると開発速度が大幅に改善する。具体的な導入条件と運用方法も本文で説明する。まず既存工程を計測し、変更後にも同じ条件で測定する。チーム全員が結果を確認し、問題があれば元の運用へ戻せるようにする。`
    );
    expect(action).toMatchObject({ label: 'この主張を根拠で裏付ける', panel: 'facts' });
  });

  it('構成と根拠に問題がなければ読者理解のwarningを直す', () => {
    const explanation =
      '手順を一つずつ記録し、担当者が同じ順番で確認できる形に整える。作業前後の状態も並べ、判断に使った条件を残す。';
    const action = decide(
      '記事タイトル',
      `## 概要

この記事では、3つの確認手順を説明する。${explanation.repeat(5)}[確認手順の参考資料](https://example.com/guide)`
    );
    expect(action).toMatchObject({
      label: '見出し「概要」が抽象的すぎる',
      panel: 'analysis',
      reason: '読者が迷う可能性',
    });
  });
});
