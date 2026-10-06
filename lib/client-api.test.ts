import { describe, expect, it } from 'vitest';
import { parseApiResponse } from './client-api';

describe('parseApiResponse', () => {
  it('JSONレスポンスを型付きで返す', async () => {
    const response = new Response(JSON.stringify({ value: 1 }));
    await expect(parseApiResponse<{ value: number }>(response, '失敗')).resolves.toEqual({
      value: 1,
    });
  });

  it('APIのエラーメッセージを優先する', async () => {
    const response = new Response(JSON.stringify({ error: '入力が不正' }), { status: 400 });
    await expect(parseApiResponse(response, '失敗')).rejects.toThrow('入力が不正');
  });

  it('空または不正なJSONを明示的なエラーへ変換する', async () => {
    await expect(parseApiResponse(new Response(null, { status: 500 }), '処理失敗')).rejects.toThrow(
      '処理失敗'
    );
    await expect(parseApiResponse(new Response('<html>error</html>'), '処理失敗')).rejects.toThrow(
      '処理失敗'
    );
  });
});
