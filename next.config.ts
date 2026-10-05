import type { NextConfig } from 'next';

/* 本番環境でのみconsole.log/infoを除去（error/warnは保持） */
const getRemoveConsoleOption = () => {
  if (process.env.NODE_ENV === 'production') {
    return { exclude: ['error', 'warn'] };
  }
  return false;
};

/* Reactの開発モードはスタックトレース再構築等のデバッグ機能でeval()を使うため、
   開発時のみCSPでunsafe-evalを許可する（本番では常に不要かつ許可しない） */
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
  'https://cdn.iframe.ly',
  'https://giscus.app',
  'https://www.googletagmanager.com',
].join(' ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://cdn.iframe.ly https://iframe.ly https://giscus.app https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com",
      "frame-src 'self' https://cdn.iframe.ly https://iframe.ly https://giscus.app https://www.typescriptlang.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  /* Cross-Origin-Embedder-Policyはcredentiallessでもgiscusがコメント欄を描画できなくなる
     既知の未解決issue(giscus/giscus#1560)があるため見送る。CORPは自サイトのリソースを
     他所から直接読み込ませないための設定で、外部埋め込みには影響しないため単独で追加する */
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
];

const nextConfig: NextConfig = {
  /* devとbuildの同時実行で成果物が衝突しないよう、開発時は.next-devへ分離する */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  /* Instant Navigations試験導入: 'use cache'による明示的キャッシュ境界とPartial Prerenderingを有効化 */
  cacheComponents: true,
  /* Linkのデフォルトprefetchを静的部分のみに限定する（cacheComponents: true必須） */
  partialPrefetching: true,
  /* コンパイラオプション */
  compiler: {
    removeConsole: getRemoveConsoleOption(),
  },
  /* パフォーマンス最適化 */
  compress: true,
  /* 画像最適化設定 */
  images: {
    /* AVIF を優先し、非対応ブラウザには WebP を自動フォールバック */
    formats: ['image/avif', 'image/webp'],
  },
  /* /writeはローカル専用。Vercel Functionへ記事原稿と同期済み画像を同梱しない */
  outputFileTracingExcludes: {
    '/api/local-writer/*': ['./blog-obsidian/**/*', './public/blog-assets/**/*'],
  },
  /* X-Powered-By ヘッダーを無効化 */
  poweredByHeader: false,
  /* 実験的な機能 */
  experimental: {
    optimizePackageImports: ['lucide-react', '@tabler/icons-react'],
    /* TypeScript 7はJS版Compiler APIを同梱しないため、tscのCLIを呼び出す方式に切り替える */
    useTypeScriptCli: true,
  },
  /* セキュリティヘッダー */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
