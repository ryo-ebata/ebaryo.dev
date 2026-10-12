#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const MAPS_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private',
  'maps'
);
const WRITE_FLAG = '--write';
const MAPS = {
  'Apache Parquet.md': `---
tags:
  - map
  - data
---
# Apache Parquet

分析処理向けの列指向ファイル形式。必要な列だけを読み取れるため、集計や大規模データの走査に向いている。

## 関連する記録

- [[private/daily/2026/08/2026-08-10|2026-08-10]]
`,
  'FTA.md': `---
tags:
  - map
  - analysis
---
# FTA

Fault Tree Analysis。望ましくない事象を頂上事象として置き、原因を論理的に分解する分析手法。

## 関連する記録

- [[private/daily/2026/10/2026-10-01|2026-10-01]]
`,
  'KPT.md': `---
tags:
  - map
  - retrospective
---
# KPT

Keep・Problem・Tryの三つの観点で活動を振り返り、維持する行動と次に試す改善を分けて考える手法。

## 関連する資料

- [[private/clipping/ソフトウェア品質戦略入門 (2)|ソフトウェア品質戦略入門]]
- [[private/archive/HeptabaseやめてObsidian始めたけど、結局Heptabaseに戻ってきた話|HeptabaseとObsidianの利用記録]]
`,
  'Orion.md': `---
tags:
  - map
  - project
---
# Orion

社内で運用しているCRMプロダクト。Bridgeなどの周辺システムとのデータ連携や、プロダクト単体で生み出す価値を継続的に考える対象。

## 関連する記録

- [[private/archive/2026-06-18 PPランチ|BridgeとOrionでの共通基盤運用]]
- [[private/daily/2026/08/2026-08-13|Orionの成果をどう捉えるか]]
- [[private/heptabase/Journal/2026-02-18|BridgeからOrionへの連携調査]]
- [[private/maps/TUKURUS|TUKURUS]]
`,
  'TUKURUS.md': `---
tags:
  - map
  - project
---
# TUKURUS

業務上の優先順位や成果を考える際に参照しているプロジェクト。現状の記録では、Orionとの一人当たり成果の比較対象として登場する。

## 関連する記録

- [[private/daily/2026/08/2026-08-10|2026-08-10]]
- [[private/daily/2026/08/2026-08-13|Orionとの成果比較]]
- [[private/maps/Orion|Orion]]
`,
  'プロトコル.md': `---
tags:
  - map
  - software-design
---
# プロトコル

システム同士が通信・相互作用するために共有する規則、形式、順序の集合。

## 関連するノート

- [[private/archive/インターフェイスとプロトコルの違い|インターフェイスとプロトコルの違い]]
- [[private/notes/エンベロープ|エンベロープ]]
`,
  '要求.md': `---
tags:
  - map
  - product-development
---
# 要求

「こうしたい」「こうありたい」という希望。要求を実現するために満たす条件が要件となる。

## 関連するノート

- [[private/archive/読書メモ|読書メモ]]
- [[private/kindle/正しいものを正しくつくる　プロダクトをつくるとはどういうことなのか、あるいはアジャイルのその先について|正しいものを正しくつくる]]
`,
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
  const pending = [];
  const conflicts = [];
  const unchanged = [];
  for (const [name, content] of Object.entries(MAPS)) {
    const filePath = path.join(MAPS_ROOT, name);
    if (!(await exists(filePath))) {
      conflicts.push(`${name}: ファイルが存在しません`);
      continue;
    }
    const current = await readFile(filePath, 'utf8');
    if (current === content) unchanged.push(name);
    else if (current.trim()) conflicts.push(`${name}: 既存内容があります`);
    else pending.push({ content, filePath, name });
  }
  console.log(
    JSON.stringify(
      {
        conflicts,
        mode: write ? 'write' : 'dry-run',
        pending: pending.map(({ name }) => name),
        unchanged,
      },
      null,
      2
    )
  );
  if (conflicts.length) throw new Error('既存のMOCを上書きせず終了します');
  if (!write) return;
  await Promise.all(pending.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[populate-obsidian-maps] ${pending.length}件のMOCを整備しました`);
};

main().catch((error) => {
  console.error('[populate-obsidian-maps] 失敗しました:', error.message);
  process.exitCode = 1;
});
