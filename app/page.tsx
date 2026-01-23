"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [text, setText] = useState("© Bản quyền Huế");
  const [position, setPosition] = useState("center");
  const [opacity, setOpacity] = useState(0.4);
  const [color, setColor] = useState("#ffffff");
  const [rotate, setRotate] = useState(0);
  const [scale, setScale] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!image) return;
    setLoading(true);

    const f = new FormData();
    f.append("image", image);
    f.append("text", text);
    f.append("position", position);
    f.append("opacity", String(opacity));
    f.append("color", color);
    f.append("rotate", String(rotate));
    f.append("scale", String(scale));
    f.append("repeat", String(repeat));
    if (logo) f.append("logo", logo);

    const res = await fetch("/api/watermark", { method: "POST", body: f });
    const blob = await res.blob();
    setResult(URL.createObjectURL(blob));
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white p-4 rounded-xl space-y-3">
        <h1 className="text-xl font-bold text-center">
          Watermark Pro
        </h1>

        <input type="file" accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)} />

        <input className="border p-2 w-full"
          value={text} onChange={(e) => setText(e.target.value)} />

        <select className="border p-2 w-full"
          onChange={(e) => setPosition(e.target.value)}>
          <option value="center">Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>

        <label>Opacity</label>
        <input type="range" min="0" max="1" step="0.05"
          value={opacity} onChange={(e) => setOpacity(+e.target.value)} />

        <label>Rotate</label>
        <input type="range" min="-90" max="90"
          value={rotate} onChange={(e) => setRotate(+e.target.value)} />

        <label>Scale</label>
        <input type="range" min="0.5" max="2" step="0.1"
          value={scale} onChange={(e) => setScale(+e.target.value)} />

        <input type="color" value={color}
          onChange={(e) => setColor(e.target.value)} />

        <label>
          <input type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)} />
          Repeat watermark
        </label>

        <input type="file" accept="image/png"
          onChange={(e) => setLogo(e.target.files?.[0] || null)} />

        <button
          onClick={submit}
          className="w-full bg-black text-white py-2 rounded">
          {loading ? "Đang xử lý..." : "Tạo Watermark"}
        </button>

        {result && (
          <a href={result} download="watermark.png">
            <img src={result} className="rounded mt-2" />
          </a>
        )}
      </div>
    </main>
  );
}
