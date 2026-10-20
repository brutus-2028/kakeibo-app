// カテゴリ別の円グラフと月別の棒グラフ
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { CATEGORIES } from "../categories.js";
import { formatMonth, formatYen } from "../utils.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

ChartJS.defaults.font.family = getComputedStyle(document.documentElement).fontFamily;
ChartJS.defaults.color = "#5f5e5a";

const SURFACE = "#ffffff"; // カード背景色（要素間のすき間の色）

/**
 * カテゴリ別の円グラフ＋内訳表
 * @param {{ totals: Record<string, number> }} props カテゴリ名 → 合計金額
 */
export function CategoryPie({ totals }) {
  const rows = CATEGORIES.filter((c) => totals[c.name] > 0);
  const sum = rows.reduce((s, c) => s + totals[c.name], 0);

  if (rows.length === 0) {
    return <p className="empty">この期間のデータはありません。</p>;
  }

  const data = {
    labels: rows.map((c) => c.name),
    datasets: [
      {
        data: rows.map((c) => totals[c.name]),
        backgroundColor: rows.map((c) => c.color),
        borderColor: SURFACE,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="pie-layout">
      <div className="pie-chart">
        <Doughnut
          data={data}
          options={{
            cutout: "55%",
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }, // 隣の表が凡例を兼ねる
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `${ctx.label}: ${formatYen(ctx.parsed)}（${Math.round((ctx.parsed / sum) * 100)}%）`,
                },
              },
            },
          }}
        />
      </div>
      <table className="summary-table">
        <tbody>
          {rows.map((c) => (
            <tr key={c.name}>
              <td>
                <span className="swatch" style={{ background: c.color }} />
                {c.name}
              </td>
              <td className="num">{formatYen(totals[c.name])}</td>
              <td className="num muted">{Math.round((totals[c.name] / sum) * 100)}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>合計</td>
            <td className="num">{formatYen(sum)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * 月別の積み上げ棒グラフ（カテゴリごとに色分け）
 * @param {{ months: string[], byMonth: Record<string, Record<string, number>> }} props
 */
export function MonthlyBar({ months, byMonth }) {
  if (months.length === 0) {
    return <p className="empty">まだデータがありません。</p>;
  }

  // データのあるカテゴリだけを表示する（色はカテゴリに固定）
  const used = CATEGORIES.filter((c) => months.some((m) => byMonth[m][c.name] > 0));

  const data = {
    labels: months.map(formatMonth),
    datasets: used.map((c) => ({
      label: c.name,
      data: months.map((m) => byMonth[m][c.name] ?? 0),
      backgroundColor: c.color,
      borderColor: SURFACE,
      borderWidth: { top: 2 }, // 積み上げた要素の間に2pxのすき間
      borderSkipped: "bottom",
      maxBarThickness: 48,
    })),
  };

  return (
    <div className="bar-chart">
      <Bar
        data={data}
        options={{
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: {
              stacked: true,
              border: { display: false },
              grid: { color: "#ecebe6" },
              ticks: { callback: (v) => formatYen(v) },
            },
          },
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, boxHeight: 12 } },
            tooltip: {
              filter: (item) => item.parsed.y > 0, // 0円のカテゴリは表示しない
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${formatYen(ctx.parsed.y)}`,
                footer: (items) =>
                  `合計: ${formatYen(items.reduce((s, i) => s + i.parsed.y, 0))}`,
              },
            },
          },
        }}
      />
    </div>
  );
}
