import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const loadOgFont = async (): Promise<ArrayBuffer> => {
  const fontPath = join(process.cwd(), 'assets/fonts/NotoSansJP-Bold.woff2');
  const buffer = await readFile(fontPath);
  return new Uint8Array(buffer).buffer;
};

const OG_FONT_ASSET_URL = 'https://assets.local/og-assets/NotoSansJP-Bold.woff2';

export const loadRuntimeOgFont = async (): Promise<ArrayBuffer> => {
  try {
    const assets = getCloudflareContext().env.ASSETS;
    if (assets) {
      const response = await assets.fetch(new Request(OG_FONT_ASSET_URL));
      if (!response.ok) throw new Error(`OG font asset request failed: ${response.status}`);
      return response.arrayBuffer();
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[og-font] Cloudflare Assetsを利用できないためファイルを読み込みます', error);
    }
  }

  return loadOgFont();
};
