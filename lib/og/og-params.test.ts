import { describe, expect, it } from 'vitest';
import {
  getThumbnailTitleSize,
  normalizeOgText,
  normalizeThumbnailLayout,
  normalizeThumbnailMotif,
  normalizeThumbnailVariant,
  OG_IMAGE_SIZE,
  recommendThumbnailPreset,
  createOgImagePath,
} from './og-params';

describe('OG_IMAGE_SIZE', () => {
  it('幅が1200pxである', () => {
    expect(OG_IMAGE_SIZE.width).toBe(1200);
  });

  it('高さが630pxである', () => {
    expect(OG_IMAGE_SIZE.height).toBe(630);
  });
});

describe('createOgImagePath', () => {
  it('記事情報からOG画像パスを作る', () => {
    const path = createOgImagePath({
      date: '2026-10-05T12:00:00Z',
      subtitle: 'Zenn',
      title: '外部記事のタイトル',
    });

    expect(path).toBe(
      '/og?title=%E5%A4%96%E9%83%A8%E8%A8%98%E4%BA%8B%E3%81%AE%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB&subtitle=Zenn&date=2026-10-05'
    );
  });
});

describe('normalizeOgText', () => {
  it('空文字ではフォールバックを返す', () => {
    expect(normalizeOgText('  ', 'fallback', 20)).toBe('fallback');
  });

  it('最大文字数で切り詰める', () => {
    expect(normalizeOgText('123456', 'fallback', 4)).toBe('1234');
  });
});

describe('normalizeThumbnailVariant', () => {
  it('既知のバリエーションを返す', () => {
    expect(normalizeThumbnailVariant('sage')).toBe('sage');
  });

  it('不正な値はpaperへ戻す', () => {
    expect(normalizeThumbnailVariant('unknown')).toBe('paper');
  });
});

describe('normalizeThumbnailLayout', () => {
  it('既知の構図を返す', () => {
    expect(normalizeThumbnailLayout('split')).toBe('split');
  });

  it('不正な値はeditorialへ戻す', () => {
    expect(normalizeThumbnailLayout('unknown')).toBe('editorial');
  });
});

describe('normalizeThumbnailMotif', () => {
  it('既知の模様を返す', () => {
    expect(normalizeThumbnailMotif('rays')).toBe('rays');
  });

  it('不正な値はnativeへ戻す', () => {
    expect(normalizeThumbnailMotif('unknown')).toBe('native');
  });
});

describe('getThumbnailTitleSize', () => {
  it('長いタイトルほど文字を小さくする', () => {
    expect(getThumbnailTitleSize('短いタイトル', 'editorial')).toBeGreaterThan(
      getThumbnailTitleSize('長'.repeat(80), 'editorial')
    );
  });

  it('中央構図では大きく組む', () => {
    expect(getThumbnailTitleSize('タイトル', 'poster')).toBeGreaterThan(
      getThumbnailTitleSize('タイトル', 'split')
    );
  });
});

describe('recommendThumbnailPreset', () => {
  it.each([
    ['Next.jsのキャッシュを理解する', ['TypeScript'], 'technical'],
    ['AIと自分の距離を考える', [], 'night'],
    ['湯河原へ読書旅行に行った', [], 'essay'],
    ['プロフィールを更新した', [], 'classic'],
  ] as const)('%sに合うプリセットを返す', (title, tags, expected) => {
    expect(recommendThumbnailPreset(title, [...tags])).toBe(expected);
  });
});
