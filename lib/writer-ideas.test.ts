import { describe, expect, it } from 'vitest';
import { createWriterIdea, rankWriterIdeas } from './writer-ideas';

const note = (title: string) => ({
  excerpt: `${title}の説明`,
  sources: ['[[private/kindle/参考書]]'],
  target: `private/notes/${title}`,
  title,
});

describe('writer ideas', () => {
  it('Mapとノートから根拠付きの構成案を作る', () => {
    const idea = createWriterIdea({
      description: 'チームを設計する知識をまとめる。',
      notes: [note('認知負荷'), note('チームAPI')],
      tags: ['topic/team-design'],
      title: 'チーム設計',
    });
    expect(idea?.title).toBe('チーム設計を実践で使うための判断軸');
    expect(idea?.body).toContain('## 認知負荷');
    expect(idea?.body).toContain('## 実務での判断');
    expect(idea?.body).toContain('[[private/kindle/参考書]]');
    expect(idea?.tags).toEqual(['team-design']);
  });

  it('ノートが1件だけのMapは記事案にしない', () => {
    expect(
      rankWriterIdeas([{ description: '', notes: [note('単独')], tags: [], title: '単独Map' }])
    ).toEqual([]);
  });

  it('テーマを分散してから別角度の記事案を補充する', () => {
    const inputs = ['テスト設計', 'チーム設計'].map((title) => ({
      description: '',
      notes: [note(`${title}A`), note(`${title}B`)],
      tags: [],
      title,
    }));
    const ideas = rankWriterIdeas(inputs, 5);

    expect(ideas.slice(0, 2).map((idea) => idea.title)).toEqual([
      'チーム設計を実践で使うための判断軸',
      'テスト設計を実践で使うための判断軸',
    ]);
    expect(ideas.map((idea) => idea.title)).toContain('チーム設計で失敗しやすい判断');
    expect(new Set(ideas.map((idea) => idea.id)).size).toBe(5);
  });
});
