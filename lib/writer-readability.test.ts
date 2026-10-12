import { describe, expect, it } from 'vitest';
import { analyzeWriterReadability } from './writer-readability';

describe('analyzeWriterReadability', () => {
  it('本文H1・見出し飛び・alt欠落・空リンクをblockerにする', () => {
    const result = analyzeWriterReadability(`# タイトル

#### 詳細

![](./image.png)

[](https://example.com)`);

    expect(result.blockers.map(({ text }) => text)).toEqual([
      '本文内のH1「タイトル」を削除する',
      '「詳細」の見出しレベルが飛んでいる',
      '説明のない画像がある',
      '名前のないリンクがある',
    ]);
  });

  it('最初の見出しがH3以降なら階層の欠落をblockerにする', () => {
    const result = analyzeWriterReadability(`### 実装

手順を説明する。`);

    expect(result.blockers[0]).toMatchObject({
      offset: 0,
      text: '最初の見出し「実装」がH3から始まっている',
    });
  });

  it('長い段落・抽象見出し・曖昧リンク・長いリストをwarningにする', () => {
    const list = Array.from({ length: 11 }, (_unused, index) => `- 選択肢${index}`).join('\n');
    const result = analyzeWriterReadability(`## 概要

${'長い文章。'.repeat(70)}

[こちら](https://example.com)

${list}`);

    expect(result.warnings.map(({ category }) => category)).toEqual(
      expect.arrayContaining(['clarity', 'link', 'choice'])
    );
    expect(result.warnings.map(({ text }) => text)).toContain('見出し「概要」が抽象的すぎる');
  });

  it('長い記事の冒頭と曖昧な指示語をhintにする', () => {
    const result = analyzeWriterReadability(`前置きを書く。

## 設計

これは${'説明を続ける。'.repeat(90)}`);

    expect(result.hints.map(({ text }) => text)).toEqual(
      expect.arrayContaining([
        '冒頭から記事の対象と効用を読み取りにくい',
        expect.stringContaining('段落冒頭'),
      ])
    );
  });

  it('問題がない記事は100点にする', () => {
    const result = analyzeWriterReadability(`この記事では設計判断を記録する方法を解説する。

## 設計判断を記録する理由

判断の背景を残すと、変更時に前提を確認できる。

## まとめ

まず一つの判断から記録する。`);

    expect(result.findings).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('コード例の見出し・画像・リンク・リスト記法を無視する', () => {
    const result = analyzeWriterReadability(`## Markdownの例

次のコードは構文例である。

\`\`\`markdown
#### 見出し
![](./image.png)
[](https://example.com)
${Array.from({ length: 11 }, (_, index) => `- 項目${index}`).join('\n')}
\`\`\``);

    expect(result.blockers).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
