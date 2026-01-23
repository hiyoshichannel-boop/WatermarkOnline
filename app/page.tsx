'use client';

import { useState } from 'react';

type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('© My Watermark');
  const [position, setPosition] = useState<Position>('center');
  const [color, setColor] = useState('#f35151');
  const [opacity, setOpacity] = useState(0.5);
  const [size, setSize] = useState(100);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultUrl(null);

    if (!file) {
      setError('Vui lòng chọn ảnh.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('text', text);
      formData.append('position', position);
      formData.append('color', color);
      formData.append('opacity', String(opacity));
      formData.append('size', String(size));

      const res = await fetch('/api/watermark', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Xử lý ảnh thất bại');
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-8 border border-gray-200">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-6">
          🖼️ Thêm watermark cho ảnh
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">📁 Chọn ảnh</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full border border-gray-300 rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">✍️ Nội dung watermark</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
              placeholder="© My Watermark"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">📍 Vị trí watermark</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="center">Giữa</option>
              <option value="top-left">Trên trái</option>
              <option value="top-right">Trên phải</option>
              <option value="bottom-left">Dưới trái</option>
              <option value="bottom-right">Dưới phải</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">🎨 Màu watermark</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 border rounded-md"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">🌫️ Độ mờ (0–1)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={1}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">🔠 Kích thước chữ (px)</label>
            <input
              type="number"
              min={12}
              max={200}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? 'Đang xử lý...' : '🚀 Tạo watermark'}
          </button>

          {error && <p className="text-red-600 font-medium">{error}</p>}
        </form>

        <div className="mt-10 grid gap-6">
          {file && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">📷 Ảnh gốc</h2>
              <img
  src={URL.createObjectURL(file)}
  alt="original"
  className="w-[600px] h-[500px] object-contain rounded-md border shadow-sm"
/>

            </div>
          )}

          {resultUrl && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">✅ Ảnh đã thêm watermark</h2>
              <img
  src={resultUrl}
  alt="watermarked"
  className="w-[600px] h-[500px] object-contain rounded-md border shadow-sm"
/>
              <a
                href={resultUrl}
                download="watermarked.png"
                className="inline-block mt-2 text-indigo-600 hover:underline font-medium"
              >
                ⬇️ Tải ảnh về
              </a>
            </div>
          )}
          <div className="text-center font-bold text-blue-600 ">
  Made by: Trí Nguyễn
</div>
        </div>
      </div>
    </main>
  );
}