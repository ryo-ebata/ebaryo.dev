export const siteConfig = {
  description: 'Web開発、データ、生成AI、Rustについて書いている個人サイト',
  author: {
    name: 'ebaryo.dev',
    bio: 'Webエンジニア。フロントエンドとデータ基盤の仕事をしながら、生成AIやRustも触っている。',
    /** プロフィール画像パス(任意)。未設定時はイニシャルを表示。 */
    avatar: '',
  },
  links: {
    github: 'https://github.com/ryo-ebata',
    qiita: 'https://qiita.com/ryo0403',
    twitter: 'https://x.com/ebaryo43',
    zenn: 'https://zenn.dev/ebarinyo',
  },
  name: 'ebaryo.dev',
  repo: 'ryo-ebata/ebaryo.dev',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://ebaryo.dev',
  /** Search Console等のサイト所有権確認コード。未設定なら該当メタタグは出力しない。 */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};
