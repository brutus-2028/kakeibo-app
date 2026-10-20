// レシート画像のアップロードと読み取り
import { useEffect, useState } from "react";
import { resizeImage } from "../utils.js";

export default function ReceiptUpload({ onAnalyzed }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // プレビュー用 URL は不要になったら解放する
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    setError("");
    setFile(e.target.files?.[0] ?? null);
    if (!e.target.files?.[0]) setPreviewUrl(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const image = await resizeImage(file).catch(() => {
        throw new Error("この画像は読み込めません。JPEG・PNG 形式でお試しください。");
      });
      const body = new FormData();
      body.append("image", image, "receipt.jpg");
      const res = await fetch("/api/receipts/analyze", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "読み取りに失敗しました。");
      }
      onAnalyzed(data);
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload">
      <label className="file-picker">
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
        <span>{file ? file.name : "レシート画像を選択"}</span>
      </label>
      {previewUrl && <img className="preview" src={previewUrl} alt="選択したレシート" />}
      <button className="primary" onClick={handleAnalyze} disabled={!file || loading}>
        {loading ? "読み取り中…" : "読み取る"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
