// 登録済みレシートの状態管理（ローカルストレージに保存する）
import { useEffect, useState } from "react";

const STORAGE_KEY = "kakeibo.receipts";

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    // 保存データが壊れている・ストレージが使えない場合は空から始める
    return [];
  }
}

export function useReceipts() {
  const [receipts, setReceipts] = useState(load);

  // 変更があるたびに保存する
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    } catch (err) {
      console.error("ローカルストレージへの保存に失敗しました", err);
    }
  }, [receipts]);

  const addReceipt = (receipt) => setReceipts((prev) => [...prev, receipt]);

  const deleteReceipt = (id) => setReceipts((prev) => prev.filter((r) => r.id !== id));

  // 1つの商品の一部の項目を書き換える
  const updateItem = (receiptId, itemId, changes) =>
    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== receiptId
          ? r
          : { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, ...changes } : i)) },
      ),
    );

  return { receipts, addReceipt, deleteReceipt, updateItem };
}
