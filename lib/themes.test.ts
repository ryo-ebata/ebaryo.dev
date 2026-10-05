import { describe, expect, it } from 'vitest';
import { getThemesForTags } from './themes';

describe('themes', () => {
  it('タグに対応するテーマを返す', () => {
    expect(getThemesForTags(['ClaudeCode', 'CSS']).map((theme) => theme.name)).toEqual([
      '生成AIと開発',
      'Web開発',
    ]);
  });
});
