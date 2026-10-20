// 家計簿アプリのバックエンド（Claude API への中継サーバー）
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
// プロジェクト直下の .env を読み込む（receipt.js の import より前に実行する必要がある）
dotenv.config({ path: path.resolve(here, "../.env"), quiet: true });

const { analyzeReceipt, ReceiptError } = await import("./receipt.js");

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("警告: ANTHROPIC_API_KEY が設定されていません。.env を確認してください。");
}

// Claude API が受け付ける画像形式
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// アップロード画像はディスクに保存せずメモリ上で扱う（API の上限に合わせて 5MB まで）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const app = express();

// レシート画像を受け取り、読み取り結果を返す
app.post("/api/receipts/analyze", upload.single("image"), async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res
        .status(500)
        .json({ error: "サーバーに ANTHROPIC_API_KEY が設定されていません。" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "画像ファイルを選択してください。" });
    }
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({ error: "JPEG・PNG・GIF・WebP 形式の画像を選択してください。" });
    }
    const result = await analyzeReceipt(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 本番用: ビルド済みのフロントエンドを配信する
const distDir = path.resolve(here, "../client/dist");
app.use(express.static(distDir));
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => err && next());
});

// エラーをまとめて JSON で返す
app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "画像サイズは 5MB 以下にしてください。" });
  }
  if (err instanceof ReceiptError) {
    return res.status(422).json({ error: err.message });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    console.error("APIキーが無効です:", err.message);
    return res.status(500).json({ error: "サーバーのAPIキー設定に問題があります。" });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return res
      .status(429)
      .json({ error: "混み合っています。しばらくしてから再度お試しください。" });
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`Claude API エラー ${err.status}:`, err.message);
    return res.status(502).json({ error: "レシートの読み取りに失敗しました。" });
  }
  console.error(err);
  res.status(500).json({ error: "サーバーでエラーが発生しました。" });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});
