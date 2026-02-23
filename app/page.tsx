"use client";

import { url } from "inspector/promises";
import { useRef, useState } from "react";
import { blob } from "stream/consumers";

export default function Home() {
  const imagesRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<File[]>([]);
  const [icon, setIcon] = useState<File | null>(null);

  const [text, setText] = useState("© nhập Watermark");
  const [position, setPosition] = useState("center");
  const [opacity, setOpacity] = useState(0.4);
  const [color, setColor] = useState("#ffffff");
  const [repeat, setRepeat] = useState(false);
  const [wmScale, setWmScale] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (images.length === 0) {
      setError("Vui lòng chọn ảnh");
      return;
    }

    if (images.length > 2) {
      alert("Chỉ được upload tối đa 2 ảnh mỗi lần.");
      return;
    }

    setLoading(true);
    setError(null);

    const f = new FormData();
    images.forEach((img) => f.append("images", img));

    f.append("text", text);
    f.append("position", position);
    f.append("opacity", String(opacity));
    f.append("color", color);
    f.append("repeat", String(repeat));
    f.append("wmScale", String(wmScale));
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

      const contentType = res.headers.get("Content-Type") || "";

// 👉 1 ẢNH – TẢI TRỰC TIẾP
if (contentType.startsWith("image/")) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "watermarked.webp";
  document.body.appendChild(a);
  a.click();
  a.remove();

  return;
}

// 👉 2 ẢNH – SERVER TRẢ JSON
const list = await res.json();

list.forEach((item: any) => {
  const byteCharacters = atob(item.data);
  const byteNumbers = new Array(byteCharacters.length)
    .fill(0)
    .map((_, i) => byteCharacters.charCodeAt(i));

  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: "image/webp",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
});

      



      const a = document.createElement("a");
      const blob = await res.blob();

const url = URL.createObjectURL(blob);
a.href = url;
a.download = "watermarked-images.zip";
document.body.appendChild(a);
a.click();
a.remove();
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
          Tạo Watermark Online Miễn Phí 
        </h1>

        {/* UPLOAD IMAGES */}
        <div
          onClick={() => imagesRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer hover:bg-gray-50"
        >
          {images.length
            ? `Đã chọn ${images.length} ảnh`
            : "Chọn tối đa 2 ảnh"}
          <input
            ref={imagesRef}
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 2) {
                alert("Chỉ được upload tối đa 2 ảnh mỗi lần.");
                e.target.value = "";
                return;
              }
              setImages(files);
            }}
          />
        </div>

        {/* ICON */}
        <div
          onClick={() => iconRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
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

        <input
          className="border rounded p-2 w-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <select
          className="border rounded p-2 w-full"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="center">Center</option>
<option value="top-left">Top Left</option>
<option value="top-center">Top Center</option>
<option value="top-right">Top Right</option>
<option value="bottom-left">Bottom Left</option>
<option value="bottom-right">Bottom Right</option>

<option value="bottom-center">Bottom Center</option>
        </select>

        <label>Độ mờ: {opacity}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(+e.target.value)}
        />
<br/>
        <label>Kích thước watermark: {wmScale}x</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={wmScale}
          onChange={(e) => setWmScale(+e.target.value)}
        />

        <div className="flex items-center justify-between">
          <label>Màu watermark</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
          />
          Lặp watermark
        </label>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Tạo Watermark "}
        </button>
        <section className="text-base text-gray-600 space-y-2">
  
  <p>
    Ảnh được xử lý trực tiếp, không lưu trữ trên máy chủ,
    đảm bảo an toàn và bảo mật tuyệt đối.
  </p>
</section>
<p className="text-sm text-gray-600 mt-4">
Bạn cần chia sẻ ảnh có watermark bằng mã QR? 
<a href="https://qrfree.io.vn" target="_blank" className="text-blue-600 underline">
 Tạo QR Code miễn phí tại đây
</a>
</p>


       
        <footer className="mt-8 border-t pt-4 text-base text-gray-600">
  <nav className="flex flex-col gap-3 items-center text-center">
    <div className="flex gap-4">
      <a href="/contact" rel="nofollow">
        Liên hệ
      </a>
      <span>|</span>
      <a href="/privacy">
        Privacy Policy
      </a>
    </div>

    <p className="text-xs text-gray-500">
      © {new Date().getFullYear()} WatermarkPro – Công cụ chèn watermark ảnh online 
    </p>
    <p className="text-xs text-gray-500">
      Made by: TriNguyen
    </p>
  </nav>
</footer>
      </div>
      

    </main>
    
  );
  
}
