import { describe, expect, it } from 'vitest';
import { applyPublicationMode, getPublicationMode, getSeoLengthState } from './writer-publishing';

describe('writer publishing', () => {
  const today = '2026-10-05';

  it('下書き・公開済み・予約公開を判定する', () => {
    expect(getPublicationMode({ createdAt: today, draft: true }, today)).toBe('draft');
    expect(getPublicationMode({ createdAt: today, draft: false }, today)).toBe('published');
    expect(getPublicationMode({ createdAt: '2026-10-06', draft: false }, today)).toBe('scheduled');
  });

  it('予約公開へ切り替えると翌日を初期設定する', () => {
    expect(applyPublicationMode({ createdAt: today, draft: true }, 'scheduled', today)).toEqual({
      createdAt: '2026-10-06',
      draft: false,
    });
  });

  it('公開へ切り替えると公開日を今日にする', () => {
    expect(
      applyPublicationMode({ createdAt: '2026-10-10', draft: true }, 'published', today)
    ).toEqual({ createdAt: today, draft: false });
  });

  it('既存の公開日は変更しない', () => {
    expect(
      applyPublicationMode({ createdAt: '2025-01-01', draft: true }, 'published', today)
    ).toEqual({ createdAt: '2025-01-01', draft: false });
  });

  it('SEO文字数の状態を返す', () => {
    expect(getSeoLengthState(0, 30, 60)).toBe('empty');
    expect(getSeoLengthState(20, 30, 60)).toBe('short');
    expect(getSeoLengthState(40, 30, 60)).toBe('good');
    expect(getSeoLengthState(61, 30, 60)).toBe('long');
  });
});
