"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [text, setText] = useState("© My Watermark");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);

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
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-4 space-y-4">
        <h1 className="text-xl font-bold text-center">
          Watermark Image Online
        </h1>

        <input
          type="file"
          accept="image/*"
          className="w-full"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Watermark text"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Add Watermark"}
        </button>

        {result && (
          <img
            src={result}
            alt="Result"
            className="w-full rounded"
          />
        )}
      </div>
    </main>
  );
}
