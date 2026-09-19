import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

/* timestampはperformance.timeOrigin基準で作るためfake timersでは固定できない
   (Cache Componentsのprerenderがnew Date()を拒否するのでDateを使っていない)。
   値そのものではなくISO 8601形式であることを検証する */
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error', () => {
    it('構造化ログをJSON形式で出力する', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('APIリクエスト失敗', { source: 'qiita' });

      expect(consoleSpy).toHaveBeenCalledOnce();
      const { timestamp, ...output } = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output).toEqual({
        level: 'error',
        message: 'APIリクエスト失敗',
        source: 'qiita',
      });
      expect(timestamp).toMatch(ISO_8601);
    });

    it('Errorオブジェクトのmessageとstackを含める', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Network error');

      logger.error('リクエスト失敗', { source: 'zenn' }, testError);

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.error.message).toBe('Network error');
      expect(output.error.stack).toBeDefined();
    });

    it('Error以外のエラーをString変換する', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('失敗', { source: 'test' }, 'string error');

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.error.message).toBe('string error');
    });

    it('追加のコンテキスト情報を含める', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('エラー', { source: 'api', statusCode: 500, url: '/test' });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.statusCode).toBe(500);
      expect(output.url).toBe('/test');
    });
  });

  describe('warn', () => {
    it('警告ログをJSON形式で出力する', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logger.warn('トークン未設定', { source: 'qiita' });

      expect(consoleSpy).toHaveBeenCalledOnce();
      const { timestamp, ...output } = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output).toEqual({
        level: 'warn',
        message: 'トークン未設定',
        source: 'qiita',
      });
      expect(timestamp).toMatch(ISO_8601);
    });
  });
});
