"use client";

import { useRef, useState } from "react";

export default function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);

  const [text, setText] = useState("© Nội Dung Watermark");
  const [position, setPosition] = useState("center");
  const [opacity, setOpacity] = useState(0.4);
  const [color, setColor] = useState("#ffffff");
  const [repeat, setRepeat] = useState(false);

  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!image) {
      setError("Vui lòng chọn ảnh");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const f = new FormData();
    f.append("image", image);
    f.append("text", text);
    f.append("position", position);
    f.append("opacity", String(opacity));
    f.append("color", color);
    f.append("repeat", String(repeat));
    if (icon) f.append("icon", icon);

    try {
      const res = await fetch("/api/watermark", {
        method: "POST",
        body: f,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }

      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center p-4">
      <div className="w-full max-w-md bg-white p-5 rounded-xl shadow space-y-4">
        <h1 className="text-xl font-bold text-center">
          Watermark Pro
        </h1>

        {/* IMAGE UPLOAD */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer hover:bg-gray-50 transition"
        >
          {image ? image.name : "Chọn ảnh gốc"}
          <input
            ref={fileRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files?.[0] || null)
            }
          />
        </div>

        {/* ICON UPLOAD */}
        <div
          onClick={() => iconRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition"
        >
          {icon ? icon.name : "Chọn icon watermark (PNG / SVG)"}
          <input
            ref={iconRef}
            hidden
            type="file"
            accept="image/png,image/svg+xml"
            onChange={(e) =>
              setIcon(e.target.files?.[0] || null)
            }
          />
        </div>

        {/* TEXT */}
        <input
          className="border rounded p-2 w-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nội dung watermark"
        />

        {/* POSITION */}
        <select
          className="border rounded p-2 w-full"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="center">Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>

        {/* OPACITY */}
        <div>
          <label className="text-sm font-medium">
            Độ mờ: {opacity}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(+e.target.value)}
            className="w-full"
          />
        </div>

        {/* COLOR WITH LABEL */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Màu watermark
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 border rounded cursor-pointer"
          />
        </div>

        {/* REPEAT */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
          />
          Lặp watermark
        </label>

        {/* BUTTON */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Tạo Watermark"}
        </button>

        {/* ERROR */}
        {error && (
          <div className="text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="space-y-2">
            <img
              src={result}
              alt="Result"
              className="rounded w-full"
            />
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
