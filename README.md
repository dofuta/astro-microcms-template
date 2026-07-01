# astro-microcms-template

Astro + microCMS のテンプレートです。

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` を編集してから `npm run dev` で起動します。

## microCMS 接続

### 環境変数

[microCMS](https://microcms.io/) のサービス設定から値を取得し、`.env` に設定します。

| 変数                      | 説明                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `MICROCMS_SERVICE_DOMAIN` | サービスドメイン（`https://{domain}.microcms.io` の `{domain}` 部分） |
| `MICROCMS_API_KEY`        | API キー（設定 → API キー）                                           |

### クライアント

`src/libs/microcms.ts` で SDK クライアントを生成し、次の API を呼び出します。

| 関数               | エンドポイント |
| ------------------ | -------------- |
| `getNewsItems()`   | `news`         |
| `getMediaItems()`  | `media`        |
| `getClientItems()` | `clients`      |

ページやコンポーネントの frontmatter から import して利用します（ビルド時にサーバー側で取得）。

```astro
---
import { getNewsItems } from '~/libs/microcms';
const { contents } = await getNewsItems({ limit: 10 });
---
```

microCMS 管理画面で上記と同じ API ID のコンテンツを用意してください。画像は CSP で `images.microcms-assets.io` を許可済みです。

## iPhone 実機検証

Mac と iPhone を**同じ Wi‑Fi**に接続し、開発マシンのファイアウォールでローカル接続を許可してください。

### 起動

```bash
npm run dev:phone
```

`dev:phone` は次を同時に起動します。

- Astro dev（`--host` で LAN 向け URL を公開）
- ログ受信サーバー（既定ポート `3847`）

ターミナルに表示される **Network URL** または **QR コード** を iPhone の Safari で開きます。

### ブラウザログの確認（remoteConsole）

`src/scripts/remoteConsole.ts` が `console.*` と未処理エラーを Mac へ送信します。`Layout.astro` 経由で `src/scripts/common.ts` から有効化されます。

| 項目         | 内容                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| ログビューア | Mac のブラウザで `http://localhost:3847/`                              |
| ログファイル | `.cursor/logs/<commit>.ingest.log`                                     |
| 無効化       | URL に `?ingest=0`                                                     |
| 送信先の変更 | `ingestHost` / `ingestPort` / `ingestProtocol` / `ingestUrl`（クエリ） |

実機では送信先ホストがページと同じ LAN IP になるため、`localhost` への送信は行いません（`remoteConsole.ts` の安全チェック）。

開発時のみ CSP が ingest 用ポート（`3847`）への `connect-src` を許可します（`Layout.astro`）。

### トラブル時

- ポート競合: `lsof -i :3847` で確認。別ポートは `INGEST_PORT=xxxx npm run dev:phone`
- ingest が落ちた場合は `dev:phone` ごと再起動

## GitHub Actions で別リポジトリへ同期

`.github/workflows/sync-to-target.yml` は、`main` ブランチへの push をきっかけに、このリポジトリの内容を別リポジトリへ同期します。同期先にはタイムスタンプ付きのコミットメッセージで変更が積まれます。

事前に、同期先リポジトリを GitHub 上に作成し、GitHub CLI で `gh auth login` を済ませてください。その後、ローカルで `.github.env` を作成して Secrets/Variables を登録します。

```bash
cp .github.env.example .github.env
npm run github:sync:config
```

このコマンドは `git remote get-url origin` から登録先リポジトリを判定し、`gh secret set` / `gh variable set` で origin 側に設定します。

`.github.env` は `.gitignore` 済みです。classic PAT などの実値はコミットしないでください。

| 種別 | 名前 | 内容 |
| --- | --- | --- |
| Secret | `SYNC_TARGET_TOKEN` | 同期先リポジトリへ push できる classic PAT（`repo` scope） |
| Variable | `SYNC_TARGET_REPO` | 同期先リポジトリ（例: `dofuta/target-repo`） |
| Variable | `SYNC_TARGET_BRANCH` | 同期先ブランチ。未設定の場合は `main` |
