// アプリ全体の画面構成
import { useMemo, useState } from "react";
import ReceiptUpload from "./components/ReceiptUpload.jsx";
import ReceiptDraft from "./components/ReceiptDraft.jsx";
import ReceiptList from "./components/ReceiptList.jsx";
import { CategoryPie, MonthlyBar } from "./components/Charts.jsx";
import { useReceipts } from "./useReceipts.js";
import { formatMonth, monthOf } from "./utils.js";

export default function App() {
  const { receipts, addReceipt, deleteReceipt, updateItem } = useReceipts();
  const [draft, setDraft] = useState(null); // 読み取り直後・登録前のデータ
  const [selectedMonth, setSelectedMonth] = useState("all");

  // 月ごと・カテゴリごとの合計を計算する
  const { months, byMonth } = useMemo(() => {
    const byMonth = {};
    for (const r of receipts) {
      const m = monthOf(r.date);
      byMonth[m] ??= {};
      for (const item of r.items) {
        byMonth[m][item.category] = (byMonth[m][item.category] ?? 0) + item.price;
      }
    }
    return { months: Object.keys(byMonth).sort(), byMonth };
  }, [receipts]);

  // 円グラフ用: 選択中の月（または全期間）のカテゴリ別合計
  const categoryTotals = useMemo(() => {
    if (selectedMonth !== "all") return byMonth[selectedMonth] ?? {};
    const totals = {};
    for (const m of months) {
      for (const [cat, value] of Object.entries(byMonth[m])) {
        totals[cat] = (totals[cat] ?? 0) + value;
      }
    }
    return totals;
  }, [months, byMonth, selectedMonth]);

  // 一覧は購入日の新しい順
  const sortedReceipts = useMemo(
    () => [...receipts].sort((a, b) => b.date.localeCompare(a.date)),
    [receipts],
  );

  const handleSave = (receipt) => {
    addReceipt(receipt);
    setDraft(null);
  };

  return (
    <div className="app">
      <header>
        <h1>レシート家計簿</h1>
        <p className="subtitle">レシートを撮影してアップロードするだけで、自動で記録・分類します</p>
      </header>

      <section className="card">
        <h2>レシートを読み取る</h2>
        {draft ? (
          <ReceiptDraft result={draft} onSave={handleSave} onCancel={() => setDraft(null)} />
        ) : (
          <ReceiptUpload onAnalyzed={setDraft} />
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>カテゴリ別の支出</h2>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="all">全期間</option>
            {[...months].reverse().map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <CategoryPie totals={categoryTotals} />
      </section>

      <section className="card">
        <h2>月別の支出</h2>
        <MonthlyBar months={months} byMonth={byMonth} />
      </section>

      <section className="card">
        <h2>登録済みのレシート</h2>
        <ReceiptList
          receipts={sortedReceipts}
          onDelete={deleteReceipt}
          onUpdateItem={updateItem}
        />
      </section>
    </div>
  );
}
