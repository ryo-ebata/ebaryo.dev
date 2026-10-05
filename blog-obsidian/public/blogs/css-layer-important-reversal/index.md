---
title: CSS @layerで!importantを使うと優先順位が逆転する
description: >-
  CSS @layerでは通常「後に宣言したレイヤーが強い」が、!importantを使うと優先順位が完全に逆転する。Claude
  Codeとの対話で発見したこの直感に反する仕様を、実例とともに解説。
createdAt: '2026-01-18T00:00:00.000Z'
updatedAt: '2026-10-05T13:30:36.401Z'
tags:
  - CSS
  - フロントエンド
draft: false
seoTitle: CSS @layerで!importantを使うと優先順位が逆転する
eyecatch:
  alt: CSS @layerで!importantを使うと優先順位が逆転するのサムネイル画像
  height: 630
  url: images/eyecatch-generated.svg
  width: 1200
---
## はじめに

あなたは「CSS @layer」をちゃんと触ったことがあるだろうか。私は恥ずかしながら、ちゃんと触ったことはあまりなかった。

CSS @layerは、Tailwid CSSを使っているとデフォルトでセットアップされていたりする。最近はUIコンポーネントライブラリを使ったりするので、CSSを使うというよりも、最も用途に合うコンポーネントを「選ぶ」ようなパラダイムになってきている印象だ。

これはこれで、新時代のフロントエンドという感じがする。

CSSは「詳細度(specificity)」でスタイルの優先順位が決まるため、管理が複雑になりがちだ。その複雑な詳細度バトルを、@layerを使うことでコントロールしましょう、というもの。

今回たまたま個人開発で、CSS @layerを初めてちゃんと触ることになった。\
ちゃんと理解して触るべく、[MDN](https://developer.mozilla.org/ja/docs/Web/CSS/Reference/At-rules/@layer)を眺めながらClaude Codeに質問していたところ、突然こう言われた。

```bash
「!importantを使うと、レイヤーの優先順位が逆転します。」
```

……逆転！？

## @layerの基本：後に宣言したレイヤーが強い

先述したように、@layerはCSSの詳細度をコントロールしやすくするためのもの。

まず、@layerの通常の優先順位を確認する。

```css
@layer base, components, utilities;
```

例えば上記の場合の優先順位は、「base < components < utilities」となり、全てのレイヤーで同じセレクタ・同じプロパティのCSSを書いていた場合は、utilitiesが勝利する。

後に宣言されたレイヤーほど強く、優先順位が上がる。

```css
/* LOSER... */
@layer base {
  .button {
    color: red;
  }
}

/* WINNER! */
@layer utilities {
  .button {
    color: blue;
  }
}
```

この場合、`.button`は「青色」になる。`utilities`の方が後に宣言されているから。

なるほど、「後に書いたレイヤー」が「前に書いたレイヤー」を上書きするイメージだから、これはとてもわかりやすい。

## !importantを使うと逆転する

ここからが本題。`!important`を加えてみる。

```css
@layer base, utilities;

@layer base {
  .button {
    color: red !important;
  }
}

@layer utilities {
  .button {
    color: blue !important;
  }
}
```

さて、`.button`は何色になるか？

答えは「赤色」である。

`!important`を使うと、レイヤーの優先順位が完全に逆転する。 `@layer base`の方が弱いレイヤーなのに、`!important`同士の比較では`@layer base`が勝つ。

## なぜこんな仕様なのか

この直感に反する仕様について理解するため、我々はアマゾンの奥地に向かった。これは「CSS Cascadeの設計思想」に基づいているのだそう。

MDNによると、カスケードの優先順位は以下の順序で評価される。

https\://developer.mozilla.org/ja/docs/Web/CSS/Reference/At-rules/@layer

1. Origin（出所）と!important
2. Context（Shadow DOMなど）
3. style属性（インライン）
4. Layers（レイヤー）
5. Specificity（詳細度）
6. Order of appearance（出現順）

重要なのは、`!important`は「通常スタイルの優先順位を逆転させる」という役割を持っていること。大富豪で言う革命、イレブンバックみたいな現象が発生する。

これは意図的な設計で、リセットCSSやベーススタイルを最も弱いレイヤーに置きつつ、そこで`!important`を使えば「絶対に上書きされないベーススタイル」を作れる、という発想らしい。

## 実務での影響

この仕様を知らないと、以下のような場面で混乱する。

- サードパーティライブラリ（Tailwind、Bootstrap等）との共存
- リセットCSSの設計
- 既存のCSS構造への@layer導入

特に「!importantで強制的に上書きしよう」と思って書いたスタイルが、レイヤー構造のせいで負けるケースは厄介。

## 教訓

@layerは詳細度の問題を解決する強力な機能だが、!importantとの組み合わせは直感に反する挙動をする。

- できるだけ`!important`を使わない設計を心がける
- 使う場合は、レイヤーの優先順位が逆転することを理解しておく
- AIツールとの対話で「知らなかった仕様」に出会えることもある

Claude Codeに教えてもらわなかったら、いつかバグとして遭遇していたかもしれない。
