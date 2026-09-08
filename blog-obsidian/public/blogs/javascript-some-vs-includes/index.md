---
title: 'JavaScriptのsomeとincludes、違いは「値」か「条件」か'
createdAt: '2026-09-08T00:00:00.000Z'
updatedAt: '2026-09-08T00:00:00.000Z'
tags:
  - 'JavaScript'
  - 'フロントエンド'
draft: false
---

`some()` と `includes()` はどちらも `boolean` を返す。違いは、「何を見ているか」だけで決まる。

- `includes()` は配列（や文字列）に **値そのもの** があるか
- `some()` は配列の要素が **条件** を満たすか

この1行を先に押さえたほうが、ミスが激減する。

## まず結論

```js
const nums = [1, 2, 3, 4]

nums.includes(3)      // true
nums.includes(10)     // false

nums.some((n) => n > 3)   // true
nums.some((n) => n > 10)  // false
```

値一致を見たいなら `includes()`。  
複数条件やプロパティ条件を見たいなら `some()`。

## `includes()` の実際

```js
['admin', 'editor', 'viewer'].includes(role)
```

### 特徴

- 比較は値そのもの
- `NaN` は `NaN` と一致として扱う
- 参照型は中身ではなく参照で比較

```js
[NaN].includes(NaN) // true
[{ id: 1 }].includes({ id: 1 }) // false
```

見た目が同じでも別オブジェクトなら `false` になる。ここでハマる。

## `some()` の実際

```js
const users = [
  { id: 1, role: 'user', active: false },
  { id: 2, role: 'admin', active: true },
]

users.some((u) => u.role === 'admin' && u.active)
// true

users.some((u) => u.id > 10)
// false
```

### 特徴

- コールバックで条件を自分で定義できる
- 条件を1つでも満たす要素が見つかれば即 `true`
- 無ければ `false`

`some()` は `includes()` 相当を再現できる。

```js
[1, 2, 3, 4].some((v) => v === 3)
// true
```

逆は原則不可。`some()` の複雑条件を `includes()` で書くのは難しい。

## 実務での選び方

1. 値の存在確認だけなら `includes()`
2. 条件判定なら `some()`
3. 大きな集合を頻繁に検索するなら `Set` の `has()` も検討

## 失敗しやすい誤用

```js
const users = [{ id: 1 }, { id: 2 }]

users.includes({ id: 2 }) // false（参照一致でない）
users.some((u) => u.id === 2) // true
```

`includes()` でオブジェクト検索を期待しない。条件で判定したければ `some()` を使う。

## まとめ

`includes()` は「値で見る」。  
`some()` は「条件で見る」。

どちらも戻り値は `boolean`。  
次に同じ設計判断が必要になったら、`値か条件か` を先に決めればほぼ迷わない。

## このページで実行して確認する

下の `iframe` で確認できる。埋め込みがブロックされる環境では、下部リンクから同じ内容を開いてください。

<div style="position: relative; width: 100%; aspect-ratio: 16 / 9;">
  <iframe
    src="https://www.typescriptlang.org/play?module=1#code/JYOwLgpgTgZghgYwgAgOIEMC2EAXATyA9mAK6gC8EA3mQHYD8A3gL4wB8AXNQG8AoKqA5hAA8A3hAAoAlN1h1j9A"
    title="TypeScript Playground: some vs includes"
    loading="lazy"
    style="position:absolute; inset:0; width:100%; height:100%; border:1px solid #ddd;"
  ></iframe>
</div>

<div style="margin-top: 12px;">
  <a href="https://www.typescriptlang.org/play?#code/JYOwLgpgTgZghgYwgAgOIEMC2EAXATyA9mAK6gC8EA3mQHYD8A3hAAoAlN1h1j9A" target="_blank" rel="noopener noreferrer">
    別タブで開く（TypeScript Playground）
  </a>
</div>

<div style="margin-top: 24px;">
  うまく表示されない場合は、同等の例を以下で作成している。
  <ul>
    <li><a href="https://playcode.io/javascript" target="_blank" rel="noopener noreferrer">PlayCode（外部実行環境）</a></li>
    <li><a href="https://codesandbox.io" target="_blank" rel="noopener noreferrer">CodeSandbox</a></li>
  </ul>
</div>

確認順:

1. `includes` でオブジェクトを探して `false` になる
2. `some` で `role` と `active` を同時条件にする
3. `NaN` を `includes` で `true` になる
