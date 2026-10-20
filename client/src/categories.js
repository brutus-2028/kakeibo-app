// 分類カテゴリと表示色（server/receipt.js の CATEGORIES と同じ並びに保つこと）
// 色は色覚多様性に配慮して検証済みの順序。「その他」だけは意図的に灰色にしている
export const CATEGORIES = [
  { name: "食費", color: "#2a78d6" },
  { name: "外食", color: "#eb6834" },
  { name: "日用品", color: "#1baf7a" },
  { name: "飲料・嗜好品", color: "#eda100" },
  { name: "衣服・美容", color: "#e87ba4" },
  { name: "医療・健康", color: "#008300" },
  { name: "交通費", color: "#6250d6" },
  { name: "娯楽・趣味", color: "#e34948" },
  { name: "その他", color: "#8a8f98" },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function categoryColor(name) {
  return CATEGORIES.find((c) => c.name === name)?.color ?? "#8a8f98";
}
