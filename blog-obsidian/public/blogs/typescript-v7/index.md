---
title: 'TypeScript v7へのアップデート'
createdAt: '2026-08-06T13:19:18.462Z'
updatedAt: '2026-08-06T13:19:18.462Z'
tags:
  - 'TypeScript'
  - 'リリースノート'
draft: false
eyecatch:
  url: images/typescript-7.png
  width: 2816
  height: 1536
---

TypeScript 7、出ましたね。

<https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/>

コンパイラをGoで書き直すという、去年からずっと話題になっていたあれが、ついに正式版になっています。

正直に、個人ブログにTypeScript 7が必要かと言われれば必要ありません。型チェックは元から3秒足らずで終わっていましたし、仮に8倍速くなったところで体感は何も変わらないです。

それでも上げたのには理由が2つあります。

ひとつは、業務で触っているプロダクトでいきなり試すわけにはいかないからです。

メジャーバージョンを跨ぐアップグレードは、どこで問題が起きるか読めないうちは着手できません。失敗しても誰も困らないリポジトリで先に試したかった、というのが素直なところです。

もうひとつは、TypeScript 7 の破壊的変更がこれまでのメジャーアップデートとは種類が違うからです。

詳しくは後述しますが、問題が起きるのは自分が書いたコードではなく、TypeScriptを使っている周辺ツールのほうです。つまり移行の難易度はコードベースの大きさではなく、ツール構成で決まります。だとすれば、小さなリポジトリで試しても学べることは十分あるはずだと考えました。

結果から言うと、変更したのは`package.json`、`pnpm-lock.yaml`、`next.config.ts`、それとテストコード2ファイルだけでした。`tsconfig.json`は1行も触っていません。`next build`の型チェックは2.7sから785msになりました。

ただ、事前に立てた予測は3つのうち1つが完全に外れ、1つは当たったものの問題が起きる場所を読み違えました。そのズレと、後から原因を突き止めるまでの記録がこの記事の本題です。

## TypeScript 7で何が変わったのか

ひとことで言えば、コンパイラがJavaScriptからGoに置き換わりました。開発中はProject Corsaと呼ばれていたものです。

先に押さえておきたいのは、型システムに新しい構文が入ったわけではないという点です。メジャーバージョンが上がったのに言語機能の追加が主役ではない、というのがこのリリースの特殊なところになります。変わったのは実装であって、書けるコードではありません。

その結果として3つのことが起きています。

**速くなりました**。公式ベンチマークでは型チェックが8倍から12倍、ピークメモリが6%から26%削減。エディタでエラーが表示されるまでの時間は、VS Codeのコードベースで17.5秒から1.3秒を切るところまで縮んだと書かれています。手元で計測した結果は後半に書きます。

**エディタの基盤がLSPに載り替わりました**。独自プロトコルのtsserverからLanguage Server Protocolベースに刷新され、マルチスレッドで同時リクエストを捌くようになっています。

**そして、パッケージの中身が変わりました**。移行時に直接影響するのはここだけで、以降はほぼこの話になります。

## 移行結果のサマリ

| 項目            | 結果                                                            |
| --------------- | --------------------------------------------------------------- |
| `tsconfig.json` | 無変更                                                          |
| Next.js         | 16.1.5 から 16.2.12 へ先行アップグレード                        |
| TypeScript      | `^5`（5.9.3）から `^7.0.2` へ                                   |
| 必要だった設定  | `next.config.ts` に `experimental.useTypeScriptCli: true` の1行 |
| Storybook       | 予測に反して無変更で動いた                                      |
| 副産物          | 既存の型エラー2件を発見（TypeScript 7 とは無関係）              |
| 型チェック時間  | 2.7s から 785ms（約3.4倍）                                      |

## 移行前の構成

- Next.js 16.1.5（App Router）
- TypeScript 5.9.3
- oxlint と oxfmt（ESLint と Prettier は不使用）
- pnpm 10.7.0
- Vitest 4、Playwright 1.57、Storybook 10（`@storybook/nextjs-vite`）

着手前にベースラインを取りました。`pnpm run check`、`pnpm run build`、ユニットテスト42ファイル248件、すべてグリーンです。この結果が、後で原因を特定する基準になります。

作業自体は Claude Code のセッションで進めました。コマンドの実行結果をそのまま残したかったからで、この記事もそのログを一次資料にしています。

## 移行で殴ってくるのはコンパイラAPIの消滅

破壊的変更は2種類あります。コンパイラAPIが消えたことと、`tsconfig` のオプションが削除されたことです。前者のほうが影響範囲は広くなります。

### TypeScript 7.0 はコンパイラAPIを一切同梱していない

公式アナウンスにはこう書かれています。

> While TypeScript 7.0 is here, it does not ship with an API. We expect TypeScript 7.1 to ship with a new (and different) API

実際に `typescript@7.0.2` の `package.json` を見ると、`exports` に `./lib/version.cjs` しかありません。従来 `require('typescript')` して `ts.createProgram()` を呼んでいたツールは、パッケージからその API を取得できません。

`bin/tsc` は Go バイナリを呼ぶ薄いシムとして生きているので、CLI として `tsc --noEmit` を叩く分には何も問題ありません。壊れるのは、TypeScript をライブラリとして読み込んでいた側だけです。

そして、将来的にも元の形には戻りません。TypeScript チームは同一プロセス内で呼べる JavaScript 版 API を維持しない方針をはっきり示していて、[typescript-go の Discussion #455](https://github.com/microsoft/typescript-go/discussions/455) ではこう説明されています。

> API consumers will typically not communicate within the same process. Instead, we expect our API to leverage a message-passing scheme, typically over an IPC layer.

つまり 7.1 で復活する API も、`ts.createProgram()` をそのまま置き換えるものにはなりません。既存ツールの移植コストは相応にかかります。

### 移行前に洗い出すべきなのは1点だけ

自分が使っているツールのうち、どれが TypeScript を CLI ではなくライブラリとして呼んでいるか。これに尽きます。候補になるのは Next.js のビルド内蔵型チェック、Storybook の docgen、型情報を使う ESLint ルール、ドキュメント生成ツールあたりです。

### 削除された tsconfig オプション

7.0 で削除または禁止されたものは公式アナウンスにまとまっています。主なところを挙げます。

- `target: es5`
- `downlevelIteration`
- `moduleResolution` の `node`、`node10`、`classic`
- `module` の `amd`、`umd`、`systemjs`、`none`
- `baseUrl`（`paths` はプロジェクトルート相対へ移行）
- `esModuleInterop` と `allowSyntheticDefaultImports` を `false` にすること
- `alwaysStrict` を `false` にすること
- namespace 内の `module` キーワード
- import の `asserts` キーワード（`with` を使う）

加えて挙動が変わる箇所が2つあります。`tsconfig.json` がソースディレクトリの外にあるプロジェクトは `rootDir` を明示する必要があります。`types` の自動検出にも頼れなくなるので、`"types": ["node", "jest"]` のように明示します。

### TypeScript 6.0 を飛ばしてよかったのか

ここは移行してから気づいたことです。TypeScript 6.0 は2026年3月23日にリリースされていて、公式には 5.9 と 7.0 の橋渡し役として位置づけられています。

7.0 で削除されるオプションを 6.0 では deprecation 警告として出し、`"ignoreDeprecations": "6.0"` で一時的に黙らせながら移行できる、という設計です。

本来なら 5.9 から 6.0 に上げて警告を全部潰し、それから 7.0 へ行くのが公式の想定する経路になります。私は `^5` から `^7.0.2` へ直接飛ばしました。結果として何も壊れませんでしたが、それは運が良かったのではなく、`tsconfig.json` が最初から 7.0 の要求を満たしていたからです。

逆に言えば、レガシーな設定が残っているプロジェクトが 6.0 を飛ばすと、7.0 でいきなり複数のエラーに同時に殴られることになります。6.0 を経由すれば同じ問題が警告として順番に出てきます。設定が古いという自覚があるなら、素直に 6.0 を挟んだほうがいいでしょう。

## 事前に立てた3つの予測

依存関係と設定を調べて、こう見積もりました。

**予測1。**`tsconfig.json` は無変更でいける。 削除対象のオプションをどれも使っていません。

**予測2。Next.js のビルド内蔵型チェックが壊れる。** `next build` は内部で TypeScript の JS Compiler API を叩いています。回避策として `experimental.useTypeScriptCli` があり、Next.js 16.2.12 で使えるところまでは調べがついていました。手元は 16.1.5 なので先に上げる必要があります。

**予測3。Storybookの`react-docgen-typescript`が壊れる**。`@storybook/addon-docs`がpropテーブルを自動生成するためにこれを使っていて、当時`node_modules/.pnpm/react-docgen-typescript@2.4.0_typescript@5.9.3`として解決されていました。ルートのtypescriptを7系に上げれば解決先も付け替わって壊れる、と読みました。

もうひとつ、移行前から有利だった条件があります。このリポジトリはoxlintとoxfmtを使っていてESLintに依存していません。この構成が結果的に最も有利でした。理由は後半に書きます。

## 移行手順とNext.jsを先に上げる理由

順序を分けたのは、壊れたときに原因を一意に特定するためです。Next.jsとTypeScriptを同時に上げると、何かが落ちたときに原因を特定する手間が増えます。

1. Next.js 16.1.5 から 16.2.12 へ。TypeScript は5系のまま `pnpm run build` を通し、Next.js 単体のアップグレードで壊れていないことを確認する
2. TypeScript を `^5` から `^7.0.2` へ
3. 型チェックコマンドの新設

3つめは移行とは直接関係ありません。調べていて `package.json` に `type-check` に相当するスクリプトが1つも無いことに気づきました。型チェックは `next build` の内蔵チェックに完全に暗黙依存している状態でした。

これはまずい。TypeScript のメジャーバージョンを上げるなら、まず型チェックを独立させないと「TypeScript 7 のせいで壊れたのか、元から壊れていたのか」を判定できません。

```diff
-    "check": "oxlint . && oxfmt --check .",
+    "type-check": "tsc --noEmit",
+    "check": "oxlint . && oxfmt --check . && tsc --noEmit",
```

`check` に連結したのは、CI が `pnpm run check` を呼んでいるので、ワークフローの YAML を触らずに型チェックを CI へ載せられるからです。

## 予測1は当たった

`tsconfig.json` は無変更で通りました。該当箇所を抜き出すとこうなっています。

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

削除対象に1つも当たっていません。`paths` はありますが `baseUrl` は無く、これは 7.0 が要求するプロジェクトルート相対の形そのものです。Next.js の `create-next-app` が生成する標準構成をそのまま使っていて、それが結果的に 7.0 対応済みでした。

面白いのは、これが自分の判断の結果ではないことです。フレームワークが用意したテンプレートに乗っていただけで、移行コストが勝手に下がっていました。設定ファイルを不用意にいじらないことには、こういうリターンがあります。

## 予測2は当たった。ただし壊れる場所を読み違えた

`pnpm install` の時点で、Storybook 経由の tsconfck から peer dependency 警告が出ました。予兆としては認識しています。

TypeScript 7 が入ったことを確認し、新設した型チェックを走らせ、`pnpm run check` を通し、テストへ進みました。そこで Vitest が起動に失敗します。

### `TypeScript 7.0.2 does not provide the compiler API required by Next.js` の対処

出たエラーはこれです。

```shell
TypeScript 7.0.2 does not provide the compiler API required by Next.js.
Enable experimental.useTypeScriptCli...
```

予測していたのは `next build` が落ちることでした。実際に最初に踏んだのは Vitest の起動時で、Next.js の内部がこのメッセージを出してきました。

後から `vitest.config.ts` を見て理解しました。Vitest は2つのプロジェクトを持っていて、片方が `@storybook/addon-vitest` の `storybookTest` プラグイン経由で Storybook のブラウザテストを回しています。その Storybook のフレームワークが `@storybook/nextjs-vite` なので、Vitest の起動時点で Next.js が読み込まれます。原因の見立ては合っていましたが、Next.js に依存する経路が `next build` だけではないことを、検証順序を組むときに考慮できていませんでした。

対応はエラーメッセージが指示している通り、1行足すだけで済みました。

```diff
   experimental: {
     optimizePackageImports: ['lucide-react', '@tabler/icons-react'],
     viewTransition: true,
+    /* TypeScript 7はJS版Compiler APIを同梱しないため、tscのCLIを呼び出す方式に切り替える */
+    useTypeScriptCli: true,
   },
```

これで Vitest は42ファイル248件全通過。`next build` も通り、ログに `✓ useTypeScriptCli` が出るようになりました。

エラーメッセージに解決策が書いてあるのは Next.js の設計として素直に良いと思います。TypeScript 7 対応が公式に想定されている証拠でもあります。

### useTypeScriptCli の注意点

[公式ドキュメント](https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli)を読むと、有効化する前に知っておくべきことがいくつか書かれています。

まず、この機能は experimental で「not recommended for production」と明記されています。個人ブログなので私は踏み切りましたが、業務のプロダクトなら判断は変わります。

挙動として3つ押さえておきたいところがあります。

Next.js は CLI チェッカーを自動選択しません。TypeScript 7 を入れただけで `useTypeScriptCli` を書かなければ、`next build` は有効化を促すメッセージを出して終了します。今回踏んだエラーがこれです。

型診断は`tsc`の出力がそのまま流れます。Next.js独自のコードフレーム表示やエラーの書き換えは使われなくなるので、エラーの読みやすさは落ちます。

そして、チェック対象が`tsconfig`の指すプロジェクト全体になります。テストファイルも`.next/dev/types`も含まれます。従来の内蔵チェッカーより範囲が広がるので、テストコードに型エラーを溜め込んでいるプロジェクトは、有効化するとすぐにビルドが失敗する可能性があります。

この最後の点は私にも刺さっていました。次に書きます。

## 予測3は外れた。Storybookは壊れなかった

`pnpm run build-storybook` は普通に成功しました。Vitest の Storybook ブラウザテストも通っています。

`pnpm-lock.yaml` を確認すると、`react-docgen-typescript@2.4.0` は確かに `typescript@7.0.2` に解決されています。Compiler API を直接呼ぶライブラリが、Compiler API を同梱しないバージョンの TypeScript に紐づいた状態で、ビルドが通ったことになります。

### なぜ壊れなかったのか

調べ直したら、原因が分かりました。`react-docgen-typescript` は最初から呼ばれていませんでした。

Storybook の `typescript.reactDocgen` の既定値は、`@storybook/react` が入っている場合 `'react-docgen'` になります。`'react-docgen-typescript'` ではありません。ドキュメントにはこう書かれています。

> react-docgen-typescript invokes the TypeScript compiler, which makes it slow but generally accurate. react-docgen performs its own analysis, which is much faster but incomplete.

つまり既定の `react-docgen` は Babel ベースで独自に解析していて、TypeScript の Compiler API を触りません。そして私の `.storybook/main.ts` には `typescript` の設定そのものが書かれていませんでした。既定値のままです。

`react-docgen-typescript` は `@storybook/addon-docs` の依存としてツリーに存在し、pnpm がそれを `typescript@7.0.2` に解決してはいましたが、実行時に一度も読み込まれていなかった。だから壊れようがなかったわけです。

読み違えの原因ははっきりしています。ロックファイルの解決結果だけを見て「依存している、だから壊れる」と結論を飛ばしました。確認すべきだったのは依存の有無ではなく、そのライブラリが実行時に本当に呼ばれる設定になっているかどうかでした。依存関係グラフから読める危険度は、実行パスの事実とは別物です。

なお、`typescript.reactDocgen: 'react-docgen-typescript'` を明示しているプロジェクトは話が変わります。そちらは TypeScript 7 で実際に踏む可能性が高いので、`.storybook/main.ts` を開いて確認したほうがいいです。

## 型エラー2件はTypeScript 7のせいではなかった

新設した `tsc --noEmit` を初めて走らせたら、型エラーが2件出ました。

真っ先に疑うべきは「Go 実装で診断の挙動が変わったのではないか」という筋です。切り分けのために TypeScript 5.9.3 で同じチェックを走らせました。

```shell
$ npx --package=typescript@5.9.3 tsc --noEmit
```

同じ2件が出ます。TypeScript 7 固有の回帰ではなく、独立した型チェックが一度も走っていなかったために埋もれていた既存のバグでした。

1件目は `lib/metadata.test.ts`。Next.js の `Metadata['twitter']` は card 種別で分岐するユニオン型なのに、narrowing せずに `.card` へアクセスしていました。

```diff
-      expect(result.twitter?.card).toBe('summary_large_image');
+      const twitterCard = result.twitter && 'card' in result.twitter ? result.twitter.card : undefined;
+      expect(twitterCard).toBe('summary_large_image');
```

2件目は `lib/related.test.ts`。テストヘルパーが `BaseContentMetadata` の必須フィールド `updatedAt` を渡していませんでした。

```diff
   slug,
   title: slug,
   createdAt,
+  updatedAt: createdAt,
   tags,
 });
```

どちらもテストコードで、プロダクションコードには影響しません。それでも見つかったこと自体には意味があります。`next build` の内蔵型チェックに頼りきっていると、ビルドを通す範囲の外にある型エラーは永久に見えないままです。

そして前の節で書いた通り、`useTypeScriptCli` はチェック範囲を `tsconfig` のプロジェクト全体に広げます。この2件を潰していなければ、`useTypeScriptCli` を有効化した瞬間にビルドが落ちていました。順序として、型チェックの独立とエラー修正を先にやっていたのは結果的に正解だったことになります。

バージョンを上げること自体より、上げるために足元を点検したことのほうが実利がありました。

## 計測結果は2.7sから785ms

`next build` が出力する TypeScript チェックの時間が 2.7s から 785ms になりました。約3.4倍です。

### 公式ベンチマークの8〜12倍と比べてどうか

公式アナウンスに載っている数値はこうなっています。

| プロジェクト | TypeScript 6 | TypeScript 7 | 倍率  |
| ------------ | ------------ | ------------ | ----- |
| VS Code      | 125.7s       | 10.6s        | 11.9x |
| Sentry       | 139.8s       | 15.7s        | 8.9x  |
| Bluesky      | 24.3s        | 2.8s         | 8.7x  |
| Playwright   | 12.8s        | 1.47s        | 8.7x  |

エディタ体験のほうがむしろ差は大きくなります。VS Code のコードベースでエラーが表示されるまで17.5秒かかっていたのが、1.3秒を切ると書かれています。ピークメモリも6%から26%削減されています。

私が計測した3.4倍はこれより明確に控えめです。理由は単純で、このリポジトリは個人ブログ規模なので、型チェックが元から2.7秒しかかかっていません。公式の数値はいずれも10秒以上かかるコードベースのもので、コンパイラの起動コストが相対的に大きい小さなプロジェクトでは倍率が落ちます。

計測条件も正直に書いておきます。`next build` のログに出た数値を移行前後で1回ずつ比較しただけで、複数回の平均は取っていません。参考値として扱ってください。

体感としては、2.7秒が785msになっても劇的ではありません。冒頭に書いた通り、この規模で TypeScript 7 に上げる動機は速度ではありませんでした。逆に言えば、型チェックに数十秒かけているプロジェクトなら、移行の費用対効果は私の場合とは比較にならないほど高いはずです。

## typescript-eslintを使っているなら移行はまだ早い

移行がスムーズだった最大の理由は、ESLint に依存していなかったことです。

typescript-eslint の [peer dependency は ](https://typescript-eslint.io/users/dependency-versions/)`<6.1.0` で、TypeScript 7 は範囲外にあります。無理やり入れると `Cannot read properties of undefined (reading 'Cjs')` でクラッシュするという報告が上がっていて、[TypeScript 7.0.2 対応の Issue](https://github.com/typescript-eslint/typescript-eslint/issues/12518) は not planned でクローズされています。当然で、typescript-eslint は型情報を取るために Compiler API を使っていて、その API が存在しない以上どうしようもありません。

チームは Go で書き直した [tsgolint](https://github.com/typescript-eslint/tsgolint) を実験的な proof-of-concept として進めていますが、現時点で本番運用できるものではありません。

回避策は公式から提示されています。TypeScript 6.0 の API を再エクスポートする `@typescript/typescript6` パッケージを npm alias で入れる方法です。

```bash
npm install -D typescript@npm:@typescript/typescript6
```

このパッケージは `tsc6` という実行ファイル名を持つので、`tsc` を持つ TypeScript 7 と併存できます。型情報を使う lint だけ TypeScript 6 に投げ、本体は 7 を使うという構成は組めます。

ただ、素直に言えば構成が複雑になります。型情報を使う ESLint ルールに依存しているプロジェクトは、7.1 で新しい API が出て typescript-eslint が対応するまで待つのが妥当な判断だと考えています。急いで移行して得られるのが型チェック数秒の短縮なら、その複雑さには見合いません。

逆に、oxlint のような Rust 実装や Go 実装のリンタへ既に寄せているなら、この障害は最初から存在しません。今回ぶつからなかったのは、単にそういう構成だったからです。

## 最終検証結果

すべてグリーンになりました。

- `tsc --noEmit`
- `oxlint` と `oxfmt --check`
- `next build`
- `build-storybook`
- Vitest（unit と Storybook ブラウザテスト）53ファイル293テスト
- Playwright E2E `--project=chromium` 15テスト

Playwright は最初 firefox と webkit で落ちましたが、これはブラウザバイナリが未インストールなだけで TypeScript 7 とは無関係でした。CI が chromium しか入れていないので、それに揃えて再実行しています。Storybook のブラウザテストも同じ理由で一度落ちました。

移行作業中に出る失敗が全部移行のせいだとは限りません。落ちたら必ず原因を分離してから判断したほうがいいです。今回、実際に TypeScript 7 が原因だった失敗は Next.js の Compiler API エラー1件だけで、残りは環境要因か既存バグでした。

## TypeScript 7移行前にチェックすべき4項目

**1. `tsconfig.json`の互換性**。`target: es5`、`downlevelIteration`、`moduleResolution`の`node`と`node10`と`classic`、`module`の`amd`と`umd`と`systemjs`と`none`、そして`baseUrl`。このあたりを使っていないか。加えて`rootDir`と`types`の明示が要るかどうか。モダンなバンドラ前提の構成なら、大抵は変更せずに移行できます。

**2. TypeScript をライブラリとして読み込んでいる依存の洗い出し。** これが本丸です。ただし今回学んだ通り、依存ツリーに存在することと実行時に呼ばれることは別です。ロックファイルを見るだけで終わらせず、設定ファイルを開いてそのツールが実際に有効になっているかまで確認します。

**3. ESLint への依存度。** 型情報を使う lint ルールを ESLint で組んでいるなら、ここが最大の障害になります。`@typescript/typescript6` の npm alias で回避はできますが、構成の複雑さと得られる速度を天秤にかけたうえで、待つ判断も十分あり得ます。

**4. 独立した型チェックコマンドの有無。** 移行の前提条件として先に片付けておきます。`tsc --noEmit` を単独で走らせられない状態でメジャーバージョンを上げると、出てきたエラーが移行由来か既存かを切り分けられません。私は移行の途中で慌てて作りましたが、本来は移行前に作り、TypeScript 5 でグリーンにしてから着手するのが正しい順序でした。

設定が古い自覚があるなら、TypeScript 6.0 を経由してください。7.0 で同時に殴られる代わりに、6.0 で警告として順番に受け取れます。

最後にもうひとつ。洗い出した危険箇所は推定で終わらせず、全部走らせること。今回、3つの予測のうち当てられたのは2つで、そのうち1つも壊れる場所を外していました。依存関係グラフから読める危険度は、実行して得られる事実には勝てません。
