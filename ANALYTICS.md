# プロダクト計測

## North Star

週次価値獲得読者数を主指標とする。週次ユニーク読者のうち、以下を両方満たす人数である。

1. `article_value_reached`を発生させる
2. `content_link_click`、`newsletter_subscribed`、`reader_returned`のいずれかを発生させる

## イベント

| イベント                | 発火条件                              | パラメータ                              |
| ----------------------- | ------------------------------------- | --------------------------------------- |
| `article_value_reached` | 本文50%到達または可視状態で2分滞在    | `article_slug`, `qualification_method`  |
| `content_link_click`    | 関連記事・テーマハブを開く            | `destination_path`, `placement`         |
| `newsletter_subscribed` | 購読APIが成功する                     | `placement`                             |
| `reader_returned`       | 前回訪問から30分以上7日以内に再訪する | `article_slug`, `days_since_last_visit` |

イベントは`dataLayer`へ送る。GTMで各イベント名のカスタムイベントトリガーを作り、GA4イベントへ接続する。

## 集計上の注意

- `article_value_reached`は同一タブ・同一記事で一度だけ送る。
- 再訪判定はブラウザの`localStorage`に依存するため、端末横断の再訪はGA4のユーザー識別へ委ねる。
- 同意管理やブラウザ制限でGA4へ届かない読者は集計対象外になる。
