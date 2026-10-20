// 共通の小さな関数

// 金額を「¥1,234」形式にする
export function formatYen(value) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

// 今日の日付を YYYY-MM-DD で返す
export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 日付文字列から「YYYY-MM」を取り出す
export function monthOf(date) {
  return date.slice(0, 7);
}

// 「2026-10」を「2026年10月」にする
export function formatMonth(month) {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

export function newId() {
  return crypto.randomUUID();
}

// スマホ写真は大きいため、送信前に長辺 1600px の JPEG に縮小する
export async function resizeImage(file, maxSize = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました。"))),
      "image/jpeg",
      0.9,
    );
  });
}
