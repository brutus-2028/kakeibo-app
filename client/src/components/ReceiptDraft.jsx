// 読み取り結果の確認・修正フォーム（登録前）
import { useState } from "react";
import { CATEGORY_NAMES } from "../categories.js";
import { formatYen, newId, today } from "../utils.js";

export default function ReceiptDraft({ result, onSave, onCancel }) {
  const [storeName, setStoreName] = useState(result.storeName);
  // 日付が読み取れなかった場合は今日の日付を入れておく
  const [date, setDate] = useState(result.date ?? today());
  const [items, setItems] = useState(() => result.items.map((i) => ({ ...i, id: newId() })));

  const itemsTotal = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const mismatch = result.total > 0 && itemsTotal !== result.total;

  const updateItem = (id, changes) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () =>
    setItems((prev) => [...prev, { id: newId(), name: "", price: 0, category: "その他" }]);

  const handleSave = () => {
    onSave({
      id: newId(),
      storeName: storeName.trim(),
      date,
      items: items
        .filter((i) => i.name.trim() !== "")
        .map((i) => ({ ...i, name: i.name.trim(), price: Number(i.price) || 0 })),
      receiptTotal: result.total,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="draft">
      <h3>読み取り結果を確認</h3>
      <div className="draft-header">
        <label>
          日付
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          店名
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        </label>
      </div>

      <table className="items">
        <thead>
          <tr>
            <th>商品名</th>
            <th className="num">金額</th>
            <th>カテゴリ</th>
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                />
              </td>
              <td className="num">
                <input
                  type="number"
                  className="price"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, { price: e.target.value })}
                />
              </td>
              <td>
                <select
                  value={item.category}
                  onChange={(e) => updateItem(item.id, { category: e.target.value })}
                >
                  {CATEGORY_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </td>
              <td>
                <button className="link danger" onClick={() => removeItem(item.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="link" onClick={addItem}>
        ＋ 商品を追加
      </button>

      <p className="draft-total">
        商品合計 <strong>{formatYen(itemsTotal)}</strong>
        {result.total > 0 && <span>（レシート記載の合計 {formatYen(result.total)}）</span>}
      </p>
      {mismatch && (
        <p className="warning">商品合計とレシートの合計が一致しません。金額を確認してください。</p>
      )}

      <div className="actions">
        <button onClick={onCancel}>破棄</button>
        <button className="primary" onClick={handleSave} disabled={!date}>
          登録する
        </button>
      </div>
    </div>
  );
}
