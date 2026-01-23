"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [text, setText] = useState("© Bản quyền – Hiyoshi");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("text", text);

    const res = await fetch("/api/watermark", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    setResult(URL.createObjectURL(blob));
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-4 space-y-4">
        <h1 className="text-xl font-bold text-center">
          Chèn Watermark Ảnh Online
        </h1>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full"
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập watermark (tiếng Việt OK)"
          className="w-full border rounded p-2"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Chèn Watermark"}
        </button>

        {result && (
          <div className="space-y-2">
            <img src={result} alt="Result" className="w-full rounded" />
            <a
              href={result}
              download="watermark.png"
              className="block text-center bg-green-600 text-white py-2 rounded"
            >
              Tải ảnh xuống
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
