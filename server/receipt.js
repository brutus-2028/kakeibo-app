// レシート画像を Claude API で読み取るモジュール
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// 使用モデル（Claude Haiku の最新版）
const MODEL = "claude-haiku-5-5";

// 分類カテゴリ（client/src/categories.js と同じ並びに保つこと）
export const CATEGORIES = [
  "食費",
  "外食",
  "日用品",
  "飲料・嗜好品",
  "衣服・美容",
  "医療・健康",
  "交通費",
  "娯楽・趣味",
  "その他",
];

// Claude に返させる JSON の形
const ReceiptSchema = z.object({
  isReceipt: z.boolean().describe("画像がレシート・領収書であれば true"),
  storeName: z.string().describe("店名。読み取れなければ空文字"),
  date: z
    .string()
    .nullable()
    .describe("購入日（YYYY-MM-DD 形式）。読み取れなければ null"),
  items: z.array(
    z.object({
      name: z.string().describe("商品名"),
      price: z.number().int().describe("税込金額（円、整数）。値引き後の金額"),
      category: z.enum(CATEGORIES).describe("商品のカテゴリ"),
    }),
  ),
  total: z.number().int().describe("レシートに記載された合計金額（円、整数）"),
});

const SYSTEM_PROMPT = `あなたは日本のレシートを読み取り、家計簿データに変換するアシスタントです。

読み取りのルール:
- 商品ごとに商品名・金額・カテゴリを抽出してください。
- 金額は税込の円（整数）にしてください。外税のレシートでは、各商品の税率（8%・10%）で税込額を計算してください。
- 値引き・割引の行は独立した商品にせず、直前の対象商品の金額から差し引いてください。
- 小計・合計・税額・お預かり・お釣り・ポイントの行は商品に含めないでください。
- 日付は YYYY-MM-DD 形式にしてください。和暦（令和など）は西暦に直してください。
- 判読できない文字は推測で補ってかまいませんが、存在しない商品を作らないでください。

カテゴリの選び方:
- 食費: スーパー等で買う食材・惣菜・お菓子・調味料
- 外食: レストラン・カフェ・ファストフードでの飲食（店がレシートの発行元である場合）
- 日用品: 洗剤・ティッシュ・文房具・キッチン用品など
- 飲料・嗜好品: 飲み物・酒・たばこ
- 衣服・美容: 衣類・靴・化粧品・ヘアケア
- 医療・健康: 医薬品・サプリメント・診察代
- 交通費: 電車・バス・タクシー・ガソリン・駐車場
- 娯楽・趣味: 本・ゲーム・映画・レジャー
- その他: 上記に当てはまらないもの

画像がレシートでない場合は isReceipt を false にし、items は空配列、total は 0 にしてください。`;

const client = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から読み込む

/**
 * レシート画像を解析して家計簿データを返す
 * @param {Buffer} imageBuffer 画像データ
 * @param {string} mediaType 画像の MIME タイプ（image/jpeg など）
 */
export async function analyzeReceipt(imageBuffer, mediaType) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ReceiptSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBuffer.toString("base64"),
            },
          },
          { type: "text", text: "このレシートを読み取ってください。" },
        ],
      },
    ],
  });

  // 安全上の理由で回答が拒否された場合
  if (response.stop_reason === "refusal") {
    throw new ReceiptError("この画像は読み取れませんでした。");
  }
  // 出力が途中で切れた場合
  if (response.stop_reason === "max_tokens") {
    throw new ReceiptError("レシートが長すぎて読み取りきれませんでした。");
  }
  const parsed = response.parsed_output;
  if (!parsed) {
    throw new ReceiptError("読み取り結果を解析できませんでした。");
  }
  if (!parsed.isReceipt) {
    throw new ReceiptError("レシートの画像ではないようです。");
  }
  return parsed;
}

// 利用者にそのまま表示してよいエラー
export class ReceiptError extends Error {}
