#!/usr/bin/env node
import { stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const NOTES_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'notes'
);
const WRITE_FLAG = '--write';
const UNCERTAINTY_SOURCE =
  '[[../kindle/エンジニアリング組織論への招待　～不確実性に向き合う思考と組織のリファクタリング]]';
const TEAM_TOPOLOGIES_SOURCE =
  '[[../kindle/チームトポロジー　価値あるソフトウェアをすばやく届ける適応型組織設計]]';

const note = (title, body, source) => `# ${title}

${body}

## 出典

- ${source}
`;

const NOTES = {
  '2Pizza': note(
    '2Pizza',
    'チームを、2枚のピザで食事を賄える程度の小さな人数に保つ考え方。人数を制約することで、コミュニケーション経路と調整コストの増大を抑える。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  エントロピー: note(
    'エントロピー',
    '起こり得る結果の不確実さを表す量。結果の確率が均等に近いほど大きくなり、特定の結果に偏るほど小さくなる。情報は、この不確実性を減らすものとして捉えられる。',
    UNCERTAINTY_SOURCE
  ),
  コンウェイの法則: note(
    'コンウェイの法則',
    'システムの構造は、それを設計する組織のコミュニケーション構造を反映するという法則。望むアーキテクチャーに合わせて組織間の関係を設計する逆コンウェイ戦略にもつながる。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  タックマンモデル: note(
    'タックマンモデル',
    'チームが形成期・混乱期・統一期・機能期を経て成熟するというモデル。メンバーの入れ替えはチームを以前の段階へ戻し、一時的に成果を下げる可能性がある。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  チームAPI: note(
    'チームAPI',
    'チームが他チームへ提供する責務・利用方法・連絡経路・サービス水準を明示したインターフェース。必要な協働と不要な割り込みの境界を定める。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  ダンバー数: note(
    'ダンバー数',
    '人が安定した社会関係を維持できる人数には認知的な上限があるという考え方。組織設計では、親密さや信頼の深さに応じた段階的な集団規模として扱う。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  ワーキングメモリー: note(
    'ワーキングメモリー',
    '情報を一時的に保持しながら処理するための限られた認知資源。扱う対象や切り替えが増えるほど消費され、判断や学習に使える余力が減る。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  不確実性: note(
    '不確実性',
    'まだ分からないことによって、結果を確定できない状態。エンジニアリングは、実験・観察・対話を通じて曖昧さを減らし、実現可能な具体性へ変える活動と捉えられる。',
    UNCERTAINTY_SOURCE
  ),
  不確実性コーン: note(
    '不確実性コーン',
    '計画の初期ほど見積もりの幅が大きく、学習と意思決定が進むにつれて幅が狭まることを示すモデル。初期の一点見積もりを確定値として扱わないために使う。',
    UNCERTAINTY_SOURCE
  ),
  同形力: note(
    '同形力',
    '組織の実際のコミュニケーション経路と、作られるシステムの構造が似た形へ収束する力。コンウェイの法則が働く仕組みを説明する概念である。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  学習関連負荷: note(
    '学習関連負荷',
    '新しい知識やパターンを理解し、能力を高めるために使う認知負荷。単純に減らすのではなく、学習に必要な余力として確保する。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  環境不確実性: note(
    '環境不確実性',
    '未来の状況や結果を事前には確定できないことから生じる不確実性。思考だけでは解消できず、行動・実験・観察によって減らす。',
    UNCERTAINTY_SOURCE
  ),
  認知負荷: note(
    '認知負荷',
    'ワーキングメモリーで使われる心理的な労力の総量。チームの責任範囲やシステムの複雑さが能力を超えると、学習とデリバリーの速度が落ちる。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  課題内在性負荷: note(
    '課題内在性負荷',
    '問題領域や作業そのものに本質的に含まれる認知負荷。必要な基礎知識や技術習得を支援することで扱いやすくする。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  課題外在性負荷: note(
    '課題外在性負荷',
    '分かりにくい手順や複雑な開発環境など、仕事の本質ではない周辺要因が生む認知負荷。ツール・自動化・標準化によって優先的に減らす。',
    TEAM_TOPOLOGIES_SOURCE
  ),
  通信不確実性: note(
    '通信不確実性',
    '他者の意図・理解・行動を完全には予測できないことから生じる不確実性。対話とフィードバックを重ね、認識差を観測しながら減らす。',
    UNCERTAINTY_SOURCE
  ),
};

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const creates = [];
  for (const [name, content] of Object.entries(NOTES)) {
    const filePath = path.join(NOTES_ROOT, `${name}.md`);
    if (!(await exists(filePath))) creates.push({ content, filePath });
  }
  console.log(
    JSON.stringify(
      {
        creates: creates.map(({ filePath }) => path.basename(filePath)),
        mode: write ? 'write' : 'dry-run',
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(creates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[materialize-kindle-concepts] 原子カード${creates.length}件を作成しました`);
};

main().catch((error) => {
  console.error('[materialize-kindle-concepts] 失敗しました:', error.message);
  process.exitCode = 1;
});
