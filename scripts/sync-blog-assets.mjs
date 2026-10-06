#!/usr/bin/env node
/**
 * blog-obsidian/public/blogs/{slug}/images/ 配下の添付画像を
 * public/blog-assets/{slug}/images/ へコピーする。
 * Next.jsの静的配信対象はリポジトリ直下のpublic/のみのため、
 * Obsidian Vault内の画像を配信可能にするビルド前処理として dev/build スクリプトから呼ばれる。
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BLOG_CONTENT_ROOT = path.join(process.cwd(), 'blog-obsidian', 'public', 'blogs');
const ASSETS_OUTPUT_ROOT = path.join(process.cwd(), 'public', 'blog-assets');
const OG_FONT_SOURCE = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansJP-Bold.woff2');
const OG_FONT_OUTPUT_ROOT = path.join(process.cwd(), 'public', 'og-assets');

const main = async () => {
  await rm(ASSETS_OUTPUT_ROOT, { recursive: true, force: true });

  await cp(BLOG_CONTENT_ROOT, ASSETS_OUTPUT_ROOT, {
    recursive: true,
    /* 記事本体(index.md)は配信対象外。ディレクトリ自体は拡張子を持たないため常にtrue */
    filter: (src) => path.extname(src) !== '.md',
  }).catch((error) => {
    if (error.code === 'ENOENT') {
      console.log('[sync-blog-assets] blog-obsidian/public/blogsが見つからないためスキップします');
      return;
    }
    throw error;
  });

  await mkdir(OG_FONT_OUTPUT_ROOT, { recursive: true });
  await cp(OG_FONT_SOURCE, path.join(OG_FONT_OUTPUT_ROOT, 'NotoSansJP-Bold.woff2'));

  console.log('[sync-blog-assets] 記事画像とOGフォントをpublic/へ同期しました');
};

main().catch((error) => {
  console.error('[sync-blog-assets] 失敗しました:', error);
  process.exitCode = 1;
});
