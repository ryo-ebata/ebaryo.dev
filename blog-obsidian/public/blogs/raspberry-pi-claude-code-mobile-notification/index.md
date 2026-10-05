---
title: TailscaleとntfyでClaude Codeをどこからでも操作できるようにした
description: >-
  Raspberry Pi 5を常時稼働のClaude Code実行環境にし、Tailscale
  VPNで外出先からSSH接続、ntfyで承認リクエストをiPhoneにプッシュ通知する環境を構築した。ポート開放不要、構築時間は約2時間。
createdAt: '2026-10-05T00:00:00.000Z'
updatedAt: '2026-10-05T13:37:44.237Z'
tags:
  - ClaudeCode
  - RaspberryPi
  - VPN
  - iPhone
draft: false
seoTitle: TailscaleとntfyでClaude Codeをどこからでも操作できるようにした
eyecatch:
  alt: TailscaleとntfyでClaude Codeをどこからでも操作できるようにしたのサムネイル画像
  height: 630
  url: images/eyecatch-generated.svg
  width: 1200
---
Claude Codeを長時間走らせていると、承認待ちで止まることがある。 PCの前にいないときに限って、気づいたら止まっている。

「Raspberry Piで常時稼働させて、iPhoneに通知飛ばせないかな」

調べてみたら、TailscaleとntfyでVPNもプッシュ通知も無料で簡単に構築できた。 ポート開放不要、認証も楽、ハマりポイントもほぼなし。

構築時間は約2時間。今は外出先からでもiPhoneで通知を受け取り、Termiusアプリで承認できる。 この記事では、同じ環境を再現するための手順を共有する。

## 構成の全体像

構成要素は4つ。

- Raspberry Pi 5：Claude Codeの常時稼働サーバー
- Tailscale VPN：ポート開放なしでどこからでもSSH接続できるVPN
- tmux：SSH切断してもClaude Codeセッションが継続するターミナルマルチプレクサ
- ntfy + Hooks：承認待ちや質問をiPhoneにプッシュ通知

流れとしては、Raspberry PiでClaude Codeがtmux上で動作し、承認待ちになるとHooksがntfyにリクエストを送信、iPhoneに通知が届く。通知を見たらTermiusアプリでSSH接続し、tmuxセッションに入って承認する。

## 思ったより簡単だったポイント

構築前は「VPNの設定が面倒そう」「通知システムの構築が大変そう」と身構えていた。 実際にやってみたら、どれも拍子抜けするほど簡単だった。

### Tailscale：ポート開放が不要

自宅ルーターの設定を触る覚悟をしていたが、Tailscaleは完全に不要だった。

https://tailscale.com

やることは本当に簡単で、上記のURLからTailscaleに入り、サインアップ後は案内に沿うだけ。

以下はLinuxを選択したときに促されるコマンドだ。

```sh
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

これだけ。表示されたURLをブラウザで開いて認証すれば、VPNが構築される。 iPhoneやMacにもTailscaleアプリを入れて同じアカウントでログインすれば、どこからでもSSH接続できる。

私はiPhoneだけでなく、iPadでも利用したかったためそれぞれでTailscaleをinstallした。

### ntfy：認証なしで通知が飛ぶ

https://ntfy.sh

APIキーの管理が面倒だと思っていたが、ntfyはチャンネル名だけで通知を送れる。

```sh
curl -d "test" ntfy.sh/your-unique-channel
```

これでiPhoneに通知が届く。iPhoneのntfyアプリで同じチャンネルを購読しておくだけ。 チャンネル名を推測されにくいものにすれば、実用上は問題ない。

iPhone側ではアプリをダウンロードし、自分で設定したチャンネルをサブスクライブするだけで完了。

## 構築手順

順を追って、今回行った設定を解説する。

### 1. Tailscale VPN構築

まずはVPNの設定。元々Raspberry Piを利用するときは、同じWi-Fi内であればPrivate IPでsshに入ることができる。 VPNは仮想のPrivateネットワークを構築し、VPN内のデバイス間であればPrivate IPの時と同じ要領でsshできる。

この仕組みを利用して、iPhoneとRaspberry Piを同じVPN内に設定し、iPhoneからsshする。

#### Raspberry Pi側

```sh
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

上記のコマンドを叩いて、表示されたURLをブラウザで開いて認証する。

これらを設定するまでは、Raspberry Piにモニターを用意してTerminalを操作するか、一旦Private IPからssh接続してやることになる。

#### iPhone側

App StoreからTailscaleをインストールし、同一アカウントでログイン。 アプリ側のVPNの設定も少し変更する必要があるが、案内に従ってやるだけで終わった。

また、別途sshクライアントを用意する必要がある。 私は無料で使えるTerminusを利用しているが、ここは好みでいいと思う。

#### 接続確認

VPNに設定しているiPhoneにsshクライアントをインストールしたら、以下のようにsshが可能になる。 ちなみにTerminusは「IP」「ユーザー」「パスワード」をそれぞれ入れるだけで、sshコマンドは必要としない。

```sh
ssh ユーザー名@<Tailscale IP> # 別端末から接続テスト
```

TailScaleのUIが見やすいし、IPを簡単にコピペできるので設定は容易だった。

### 2. Claude Code導入

ここまでできれば、やりたいことの80%以上は完了しているのだが、Claude CodeをRaspberry Pi内に入れるとこまでやる。

#### Node.js インストール

npm installをするので、前準備としてnodeを入れよう。 ちなみに、私が実行したコマンドをそのまま書いているが、sudoコマンドは注意して実行してほしい。

```sh
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Claude Code インストール

```sh
sudo npm install -g @anthropic-ai/claude-code
```

#### 初回起動・認証

```sh
claude
```

### 3. tmuxセッション永続化

SSH切断してもClaude Codeセッションを維持するために、tmuxを使う。

#### tmuxインストール

```sh
sudo apt install -y tmux
```

#### エイリアス設定

```sh
echo "alias cc='tmux attach -t claude || tmux new -s claude'" >> ~/.bashrc
source ~/.bashrc
```

これで `cc` コマンドを叩けば、Claude Codeセッションに入れる。 SSH切断しても、再接続して `cc` で作業状態がそのまま復帰する。

iPhoneからはTermiusアプリでSSH接続し、`cc` でセッションに入る。

iPhoneでやっていた作業を、iPadで引き継いだり、逆も簡単にできるので必須。

### 4. ntfy通知システム

ここからはClaude Codeが止まる瞬間に通知をiPhoneに飛ばす仕組みを構築する。

#### iPhone側の設定

App Storeから「ntfy」をインストールし、チャンネルを購読する（例：`your-unique-channel`）。

#### Raspberry Pi側の設定

必要なパッケージのインストールとディレクトリ作成をする。jqを使うとjsonを解析しやすくなる。

```sh
sudo apt install -y jq
mkdir -p ~/.claude/hooks
```

#### 通知スクリプトの作成

以下3つのスクリプトを作成する。

承認待ち通知

```sh
cat << 'EOF' > ~/.claude/hooks/notify-permission.sh
#!/bin/bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "不明"')
DETAIL=$(echo "$INPUT" | jq -r '.tool_input | tostring' | head -c 200)

curl -s \
  -d "ツール: $TOOL
内容: $DETAIL" \
  -H "Title: 🔐 承認待ち" \
  ntfy.sh/your-unique-channel
EOF
```

入力待ち通知

```sh
cat << 'EOF' > ~/.claude/hooks/notify-idle.sh
#!/bin/bash
curl -s \
  -d "入力を待っています" \
  -H "Title: ⏳ 入力待ち" \
  ntfy.sh/your-unique-channel
EOF
```

質問通知

```sh
cat << 'EOF' > ~/.claude/hooks/notify-question.sh
#!/bin/bash
INPUT=$(cat)
QUESTION=$(echo "$INPUT" | jq -r '.tool_input.question // "質問があります"')

curl -s \
  -d "$QUESTION" \
  -H "Title: ❓ Claudeからの質問" \
  ntfy.sh/your-unique-channel
EOF
```

#### 実行権限の付与

chmodコマンドも、注意して実行するようにしてほしい。 私のRaspberry Piは、言うても余ってたおもちゃのPCくらいの感覚なので、割とこの辺はバンバン実行していく（後悔しそうだが）。

```sh
chmod +x ~/.claude/hooks/*.sh
```

### 5. Claude Code Hooks設定

Claude Codeの設定ファイルを作成し、通知を飛ばすHooksを登録する。 Hooksとして登録しておくと、Claudeが作業を止めたタイミングに確実に通知を飛ばすshellを実行してくれる。

```sh
cat << 'EOF' > ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/notify-question.sh"
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/notify-permission.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/notify-idle.sh"
          }
        ]
      }
    ]
  }
}
EOF
```

#### Hooks実行タイミング一覧

| Hook                         | タイミング                     |
| ---------------------------- | ------------------------------ |
| PermissionRequest            | ツール実行前の承認リクエスト時 |
| Notification (idle_prompt)   | 60秒以上入力待ち時             |
| PreToolUse (AskUserQuestion) | Claudeが質問する時             |

## 今後やりたいこと

まだ構築したばかりで、これから自作OSSやこのブログサイトの開発に活用していく予定。

次のステップとして、devcontainerでsandbox環境を構築したい。 Claude Codeがより自由にファイル操作やコマンド実行できるようになれば、承認の手間も減る。 安全性と利便性のバランスを取りながら、最適な構成を探っていく。

もし余裕があれば、通知をカスタマイズしてy/nに回答できるようにしたりできると楽になりそう。

とにもかくにも、家で埃かぶって余っていたRaspberry Piを活用できそうで安心している。
