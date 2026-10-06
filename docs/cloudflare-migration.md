# Cloudflare Workers移行計画

## 方針

Next.js自体は維持し、`@opennextjs/cloudflare`でCloudflare Workers向けに変換する。Cloudflareが新規Next.js向けに推奨するvinextはまだベータであるため、既存のApp Router構成を維持できるOpenNextを採用する。

デプロイ先はCloudflare PagesではなくWorkersとする。PagesよりWorkersの方が現在のCloudflareの主系統であり、SSR、Route Handlers、画像最適化、共有キャッシュを一つの構成で扱える。

## 構成

- 実行環境: Cloudflare Workers
- Next.jsアダプター: `@opennextjs/cloudflare`
- CLI: Wrangler
- 静的ファイル: Workers Assets
- Next.js画像最適化: Cloudflare Images binding
- ISR・キャッシュ: R2 incremental cache
- 静的アセット: `/_next/static/*`を1年間immutableで配信
- 可観測性: Workers Logsを全環境で有効化し、移行期間は100%サンプリング
- ローカル専用画面: `/write`、`/portfolio/manage`は本番で管理UIを描画せず、関連APIは404を維持
- 環境分離: PreviewとProductionはWorker、R2 bucket、Secretを共有しない
- DNS・カスタムドメイン: Preview検証後、Custom Domain追加を本番切替点として実行する

## フェーズ

### 1. ローカル互換性確認

1. [完了] `pnpm build`相当のNext.js標準ビルドを確認する
2. [完了] `pnpm build:cloudflare`でWorker bundleを生成する
3. [完了] ローカルWorkerでHome、記事、OGP、外部記事サムネイル、RSSを確認する
4. [完了] ローカル専用APIが本番成果物で404になることを確認する
5. Preview Workerで画像最適化とWorkerのgzip後サイズを確認する

### 2. Cloudflareリソース準備

1. `wrangler login`で対象アカウントへ接続する
2. `ebaryo-preview-opennext-cache`と`ebaryo-production-opennext-cache`を作成する
3. `pnpm deploy:cloudflare:preview`で`ebaryo-preview`をデプロイする
4. `wrangler secret put <KEY> --env preview`でPreview用Secretを登録する
5. `NEXT_PUBLIC_*`をビルド環境へ登録する
6. 時間ベース再検証用のDurable Object Queueを作成する
7. オンデマンド再検証用のDurable Object Tag Cacheを作成する
8. Regional Cacheをlong-livedで有効化し、Tag Cacheからの自動purgeを設定する

### 3. Preview検証

- Home、Blog、記事詳細、Portfolio、About、Design System
- Zenn・Qiita取得失敗時のフォールバック
- 外部記事サムネイルと`/_next/image`
- OGP生成、RSS、sitemap、llms.txt
- `/api/revalidate`の認証とキャッシュ更新
- CSP、Giscus、GTM、広告、Newsletter
- LighthouseとWeb Vitals
- Workers MetricsのCPU時間、メモリ、エラー率、実行ステータス
- Vercel基準値とのTTFB・LCP・INP比較
- Cloudflare Imagesの月間ユニーク変換数見積もり

### 4. 本番切替

1. Production用Secretを`--env production`で登録する
2. `pnpm deploy:cloudflare:production`で`ebaryo-production`を`workers.dev`上にデプロイする
3. Production Workerを`workers.dev`上で最終確認する
4. Vercel側のCustom Domain設定と現在のDNS状態を記録する
5. Cloudflare Workerへ`ebaryo.dev`のCustom Domainを追加して切り替える
6. 旧Vercel deploymentは最低48時間残す
7. エラー率、CPU時間、リクエスト数、画像変換数、R2操作数を監視する
8. 問題がなければVercelのドメイン設定と有料プランを解除する

Custom Domain追加時にCloudflareがDNSレコード作成と証明書発行を行う。この操作自体が本番トラフィックの切替点であり、別途DNSを変更する工程として扱わない。

### 5. 停止基準

以下のいずれかを満たしたら切替を中止またはロールバックする。

- 5xx率が5分間で1%を超える
- Home、記事詳細、OGP、RSS、sitemapの合成監視が2回連続で失敗する
- P95応答時間がVercel基準値の2倍を15分以上継続する
- R2またはImagesのエラーで記事・画像が表示できない
- `revalidate`実行後10分以内に記事更新が反映されない
- 日次換算のWorkers、Images、R2費用が移行前に定めた上限を超える
- WorkerのP95 CPU時間が25msを超える、またはP99メモリが96MBを超える
- Worker bundleが32MiB、静的ファイルが2万件、単一静的ファイルが25MiBを超える

### 6. 障害対応とロールバック

- R2障害時は更新系操作を止め、既存の静的AssetsとVercel deploymentを優先する
- キャッシュ破損時は対象環境のR2 bucketだけを空にし、Previewで再生成を確認してからProductionへ反映する
- `revalidate`失敗時は同じGit revisionを再デプロイし、R2 cacheを再構築する
- 本番障害時はCloudflare Custom Domainを解除し、記録済みのVercel Custom Domain/DNS設定へ戻す
- ロールバック手順は本番切替前にサブドメインで一度通し、所要時間を記録する

記事はGit管理であり、R2には再生成可能なキャッシュだけを保存するため、切り戻し時のコンテンツ同期は不要である。

## 環境変数

Secretとして登録する値:

- `QIITA_API_ACCESS_TOKEN`
- `REVALIDATE_SECRET`
- `BUTTONDOWN_API_KEY`

通常の環境変数またはビルド変数:

- `QIITA_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- Giscus、広告、アフィリエイト関連の`NEXT_PUBLIC_*`

## 未実施

- Cloudflareアカウントへのログイン
- Preview・Production用R2 bucketの作成
- Preview Workerのデプロイ
- Secret登録
- Durable Object Queue・Tag Cache・Regional Cache・自動purgeの設定
- Preview上でのVercel対比計測と性能予算の最終調整
- Custom Domain追加による本番切替
- Vercelの停止

## ローカル検証結果

- Next.js 16.3.8とOpenNext 1.20.8でWorker bundleの生成に成功
- Home、記事詳細、RSS、動的OGP、Zenn・QiitaサムネイルがローカルWorkerで200
- OGフォントはCloudflareではWorkers Assets Binding、Vercelでは同梱ファイルから読み込む
- Node.js Middleware依存を除去し、ローカル限定判定を各ページ・APIへ集約
- 単体テスト86ファイル、450件が成功
- Cache ComponentsとPPRはworkerd上の並行実行でReact resume tree不一致が残るため無効化した
- 記事・外部記事・リンクカード・OGフォントのキャッシュは`unstable_cache`へ移行した
- Home、Blog、記事詳細、Portfolio、Aboutへの並行アクセスを100件実行し、HTTP失敗とWorker例外がないことを確認した
- Worker bundle、静的ファイル数、単一ファイルサイズをCIで検査する
- 再検証APIのSecretをURLへ露出させず、`Authorization: Bearer`で受け取る

R2 incremental cacheだけでは時間ベース再検証と`revalidateTag`・`revalidatePath`の整合性を保証できない。Durable Object QueueとTag Cacheを用意するまではPreview検証に留め、本番切替を行わない。Regional Cacheもpurge経路なしでは古い記事を長時間配信し得るため、単独では有効化しない。

Workers Paidを前提とする。無料枠のCPU時間上限10msはNext.js SSRの安全な運用余地として不足する。コード上の互換性と並行実行は確認済みだが、性能維持の保証にはPreview Workerを実トラフィックに近い条件で測定し、Vercel基準値を満たすことが必要である。

OpenNext 1.20.8が文字列形式の`package.json.exports`を条件オブジェクトとして処理し、3パッケージで誤ったコピー警告を出す問題はpnpm patchで補正した。成果物への欠落がないことに加え、記事詳細を含むローカルWorkerの主要経路が正常に応答することを確認している。パッチはOpenNext側で修正版が公開された時点で削除する。

OpenNextの[修正PR #1318](https://github.com/opennextjs/opennextjs-cloudflare/pull/1318)を1.20.8へ移植してもNext.js 16.3.8ではReact resume tree不一致が残ったため、Cache Componentsは採用しない。上流の安定版で修正された後に、独立した性能改善として再評価する。

これらは外部環境を変更するため、ローカルのCloudflareビルドが通った後に実施する。

## 参考資料

- [Cloudflare Workers: Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare: Get Started](https://opennext.js.org/cloudflare/get-started)
- [OpenNext Cloudflare: CLI](https://opennext.js.org/cloudflare/cli)
- [OpenNext Cloudflare: Bindings](https://opennext.js.org/cloudflare/bindings)
- [OpenNext Cloudflare: Caching](https://opennext.js.org/cloudflare/caching)
- [OpenNext Cloudflare: Performance](https://opennext.js.org/cloudflare/perf)
- [Cloudflare Workers: Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers: Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
