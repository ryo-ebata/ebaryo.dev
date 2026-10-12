#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PRIVATE_ROOT = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'iCloud~md~obsidian',
  'Documents',
  'blog',
  'private'
);
const MAPS_ROOT = path.join(PRIVATE_ROOT, 'maps');
const WRITE_FLAG = '--write';

const MAPS = [
  {
    description: '未知を観測可能な情報へ変え、意思決定の確度を上げるための概念をまとめる。',
    name: '不確実性と情報',
    notes: ['不確実性', '不確実性コーン', 'エントロピー', '環境不確実性', '通信不確実性'],
    tags: ['uncertainty', 'information'],
  },
  {
    description:
      'チームの境界・規模・認知能力を踏まえて、組織とソフトウェアを設計する知識をまとめる。',
    name: 'チーム設計',
    notes: [
      'コンウェイの法則',
      '同形力',
      '認知負荷',
      'ワーキングメモリー',
      '課題内在性負荷',
      '課題外在性負荷',
      '学習関連負荷',
      'ダンバー数',
      '2Pizza',
      'タックマンモデル',
      'チームAPI',
    ],
    tags: ['team-design', 'organization'],
  },
  {
    description: '固定化した認識を観察し、学び直して行動を変えるための概念をまとめる。',
    name: '学習と変化',
    notes: ['思考の癖', 'アンラーニング'],
    tags: ['learning', 'change'],
  },
  {
    description: 'Linearを開発チームで使う際の利点と、周辺サービスとの連携をまとめる。',
    name: 'Linear活用',
    notes: ['GitHubとの連携が強力'],
    tags: ['linear', 'project-management'],
  },
  {
    description: 'AIシステムを構成する検索・生成・コンテキスト管理の技術をまとめる。',
    name: 'AIシステム',
    notes: ['RAG'],
    tags: ['ai', 'architecture'],
  },
  {
    description: 'Goのコンパイル方式、標準ライブラリ、実行時特性に関する知識をまとめる。',
    name: 'Go',
    notes: ['バイナリへのコンパイル', '潤沢な標準ライブラリ'],
    tags: ['go', 'programming-language'],
  },
  {
    description: 'データを効率よく保持・探索するための基本的なデータ構造をまとめる。',
    name: 'データ構造',
    notes: ['平衡木'],
    tags: ['data-structure', 'computer-science'],
  },
  {
    description: 'Rustの所有権・借用・トレイトに関する知識と、遭遇したコンパイルエラーをまとめる。',
    name: 'Rust言語',
    notes: ['A is not a member of trait B', 'temporary value dropped while borrowed'],
    tags: ['rust', 'programming-language'],
  },
  {
    description: 'スタッフエンジニアに見られる役割の型と、技術以外に求められる働きをまとめる。',
    name: 'スタッフエンジニア',
    notes: [
      'Right Hand',
      'Solver',
      'テックリード - ストーリー',
      'エンジニアは技術力に呪われてしまう',
    ],
    tags: ['staff-engineer', 'leadership'],
  },
  {
    description: 'ソフトウェアを継続的に育てるための設計・テスト・開発観をまとめる。',
    name: 'ソフトウェア開発',
    notes: ['キャラクタライゼーションテスト', 'ソフトウェア開発 ≠ プロジェクト'],
    tags: ['software-development'],
  },
  {
    description: 'Web開発の言語・フレームワーク・モノレポ・ツールチェーンに関する知識をまとめる。',
    name: 'Web開発基盤',
    notes: [
      'Laravel',
      'Web開発におけるライブラリが潤沢',
      'node_modulesの共有が可能',
      'ts-nodeならTypeScriptのを解釈実行',
      'useActionStateのAPI',
      'フロントエンドとのコード共有が可能',
      'リンターのルール共有が可能',
    ],
    tags: ['web-development', 'tooling'],
  },
  {
    description: '永続化・キャッシュ・インメモリ処理に使うデータストアの特徴をまとめる。',
    name: 'データストア',
    notes: ['Cloudflare D1', 'Valkey'],
    tags: ['database', 'storage'],
  },
  {
    description: 'Webアプリケーションの認証方式と、資格情報を安全に運ぶ仕組みをまとめる。',
    name: '認証',
    notes: [
      'Cookieの認証方式',
      'JWT(JSON Web Token)の認証方式',
      'Cookieの認証方式とJWT(JSON Web Token)の認証方式の共通点',
    ],
    tags: ['authentication', 'security'],
  },
  {
    description:
      'デザインの成果を、事業・ユーザー・組織への貢献として評価するための論点をまとめる。',
    name: 'デザイン評価',
    notes: [
      'なぜデザイナーの価値を測るべきなのか',
      'デザイナーの価値が見えにくい理由',
      'デザイナーの曖昧さ',
      'デザイナーを評価する6つの軸：何を測るべきか',
      '評価基準の実践',
    ],
    tags: ['design', 'evaluation'],
  },
  {
    description: '異なる役割・経験・視点を開発の強みに変えるための論点をまとめる。',
    name: '多様性と協働',
    notes: ['作り手の多様性', '役割の多様性による溝', '経験の多様性による溝'],
    tags: ['diversity', 'collaboration'],
  },
  {
    description: '目標を行動へ落とし、無理なく継続するための考え方と仕組みをまとめる。',
    name: '目標と習慣',
    notes: [
      'なぜ大人になると継続できなくなるのか',
      'やる気はやってから生まれる',
      'ゴールが決まらなければ新しい体験をする',
      'ゴールを何度も確認する',
      '習慣化の3原則',
      '自分のゴールに使う時間を第一優先にする',
      '自分の目標に繋がらないことは必要最低限でこなす',
      '通知やリマインダーを活用する',
    ],
    tags: ['goals', 'habits'],
  },
];

const CONNECTIONS = [
  { map: 'DORA', note: 'Four Keys' },
  { map: '“use cache“', note: 'revalidate' },
  { map: '“use cache“', note: 'stale' },
  { map: 'Orion', note: 'Atlas（H）' },
  { map: '要求', note: 'SoRとSoEの分類' },
];

const exists = (target) =>
  stat(target)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

const renderMap = ({ description, name, notes, tags }) => `---
tags:
  - map
${tags.map((tag) => `  - ${tag}`).join('\n')}
---
# ${name}

${description}

## 関連ノート

${notes.map((note) => `- [[../notes/${note}]]`).join('\n')}
`;

const main = async () => {
  const write = process.argv.includes(WRITE_FLAG);
  const updatesByFile = new Map();
  for (const map of MAPS) {
    const mapPath = path.join(MAPS_ROOT, `${map.name}.md`);
    const missingNotes = [];
    for (const note of map.notes) {
      if (!(await exists(path.join(PRIVATE_ROOT, 'notes', `${note}.md`)))) missingNotes.push(note);
    }
    if (missingNotes.length)
      throw new Error(`${map.name}: ノートが存在しません: ${missingNotes.join(', ')}`);
    const content = renderMap(map);
    const current = (await exists(mapPath)) ? await readFile(mapPath, 'utf8') : null;
    if (current !== content) {
      updatesByFile.set(mapPath, {
        content,
        filePath: mapPath,
        type: current ? 'update' : 'create',
      });
    }
  }
  const connectionsByMap = Map.groupBy(CONNECTIONS, ({ map }) => map);
  for (const [map, connections] of connectionsByMap) {
    const mapPath = path.join(MAPS_ROOT, `${map}.md`);
    if (!(await exists(mapPath))) throw new Error(`接続先Mapが存在しません: ${map}`);
    let content = updatesByFile.get(mapPath)?.content ?? (await readFile(mapPath, 'utf8'));
    for (const connection of connections) {
      const notePath = path.join(PRIVATE_ROOT, 'notes', `${connection.note}.md`);
      if (!(await exists(notePath))) {
        throw new Error(`接続先ノートが存在しません: ${connection.map} -> ${connection.note}`);
      }
      const link = `[[../notes/${connection.note}]]`;
      if (content.includes(link)) continue;
      content = `${content.trimEnd()}\n\n${content.includes('## 関連ノート') ? '' : '## 関連ノート\n\n'}- ${link}\n`;
    }
    const current = await readFile(mapPath, 'utf8');
    if (content !== current) {
      updatesByFile.set(mapPath, { content, filePath: mapPath, type: 'update' });
    }
  }
  const updates = [...updatesByFile.values()];
  console.log(
    JSON.stringify(
      {
        creates: updates.filter(({ type }) => type === 'create').length,
        files: updates.map(({ filePath }) => path.relative(PRIVATE_ROOT, filePath)),
        mode: write ? 'write' : 'dry-run',
        updates: updates.filter(({ type }) => type === 'update').length,
      },
      null,
      2
    )
  );
  if (!write) return;
  await Promise.all(updates.map(({ content, filePath }) => writeFile(filePath, content)));
  console.log(`[connect-obsidian-orphans] ${updates.length}件のMapを更新しました`);
};

main().catch((error) => {
  console.error('[connect-obsidian-orphans] 失敗しました:', error.message);
  process.exitCode = 1;
});
