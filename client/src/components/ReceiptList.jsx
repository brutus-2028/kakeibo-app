// 登録済みレシートの一覧
import { CATEGORY_NAMES, categoryColor } from "../categories.js";
import { formatYen } from "../utils.js";

export default function ReceiptList({ receipts, onDelete, onUpdateItem }) {
  if (receipts.length === 0) {
    return <p className="empty">まだレシートが登録されていません。</p>;
  }

  return (
    <ul className="receipt-list">
      {receipts.map((receipt) => {
        const total = receipt.items.reduce((sum, i) => sum + i.price, 0);
        return (
          <li key={receipt.id} className="receipt">
            <details>
              <summary>
                <span className="receipt-date">{receipt.date}</span>
                <span className="receipt-store">{receipt.storeName || "（店名なし）"}</span>
                <span className="receipt-total">{formatYen(total)}</span>
              </summary>
              <table className="items">
                <thead>
                  <tr>
                    <th>商品名</th>
                    <th className="num">金額</th>
                    <th>カテゴリ</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="num">{formatYen(item.price)}</td>
                      <td>
                        {/* カテゴリはあとから変更できる */}
                        <select
                          value={item.category}
                          style={{ borderLeftColor: categoryColor(item.category) }}
                          className="category-select"
                          onChange={(e) =>
                            onUpdateItem(receipt.id, item.id, { category: e.target.value })
                          }
                        >
                          {CATEGORY_NAMES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="actions">
                <button
                  className="link danger"
                  onClick={() => {
                    if (confirm("このレシートを削除しますか？")) onDelete(receipt.id);
                  }}
                >
                  このレシートを削除
                </button>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
