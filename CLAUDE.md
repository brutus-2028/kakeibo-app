# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code へのガイドです。

## プロジェクト概要

レシート読み込み家計簿Webアプリ（kakeibo-app）。レシート画像を Claude API で読み取り、商品をカテゴリ別に分類・集計してグラフ表示する。

## 技術スタック

- npm workspaces 構成（`client/` と `server/`）
- `client/`: React + Vite + Chart.js（react-chartjs-2）。データはブラウザのローカルストレージ（キー `kakeibo.receipts`）に保存
- `server/`: Node.js + Express + multer。`@anthropic-ai/sdk` で Claude API を呼ぶ
  - モデルは `claude-haiku-5-5`（`server/receipt.js` の `MODEL`）
  - 構造化出力（zod スキーマ + `messages.parse`）で JSON を受け取る
- APIキーはプロジェクト直下の `.env`（`ANTHROPIC_API_KEY`）で管理。ブラウザ側に APIキーを持たせない

## 開発コマンド

- `npm install` — 依存パッケージのインストール（ルートで実行）
- `npm run dev` — 開発サーバー起動（フロント http://localhost:5173 、API http://localhost:3001）
- `npm run build` — フロントエンドのビルド
- `npm start` — 本番起動（ビルド済みフロントも http://localhost:3001 で配信）

## 注意点

- カテゴリ一覧は `server/receipt.js` と `client/src/categories.js` の2か所にある。変更時は両方を揃える

## Git運用ルール

- **コードを変更するたびに、コミットして GitHub にプッシュすること。**
  - 1つの変更（機能追加・修正・リファクタリングなど）が完了したら、その都度 `git add` → `git commit` → `git push` を行う。
  - 変更をローカルに溜め込まない。
- コミットメッセージは日本語で、変更内容が分かるように簡潔に書く。
  - 例: `支出入力フォームを追加`、`月別集計の計算ミスを修正`
- プッシュ前に、動作確認やテスト（用意されている場合）を行い、壊れた状態でプッシュしない。
- 秘密情報（APIキー、パスワード、`.env` ファイルなど）はコミットしない。必要に応じて `.gitignore` に追加する。
- プッシュが失敗した場合（リモートとの競合など）は、強制プッシュ（`--force`）せずに状況をユーザーに報告する。

## コーディング規約

- コメントやドキュメントは日本語で書く。
- 既存コードのスタイル・命名規則に合わせる。
