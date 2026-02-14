import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Watermark ảnh không vỡ – Giữ nguyên chất lượng ảnh | WatermarkPro",
  description:
    "Cách watermark ảnh không vỡ, không giảm chất lượng. WatermarkPro giúp chèn watermark chữ và logo mà vẫn giữ ảnh sắc nét.",
};

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Watermark ảnh không vỡ – Giữ nguyên chất lượng ảnh
      </h1>

      <p>
        Nhiều người lo lắng rằng watermark ảnh sẽ làm ảnh bị mờ,
        vỡ nét hoặc giảm chất lượng. Thực tế, nếu watermark đúng cách,
        ảnh vẫn giữ được độ sắc nét ban đầu.
      </p>

      <h2 className="text-xl font-semibold">
        Vì sao watermark ảnh thường bị vỡ?
      </h2>
      <ul className="list-disc pl-6">
        <li>Resize ảnh quá mạnh</li>
        <li>Xuất ảnh với chất lượng thấp</li>
        <li>Chèn watermark sai tỉ lệ</li>
      </ul>

      <h2 className="text-xl font-semibold">
        Cách watermark ảnh không vỡ với WatermarkPro
      </h2>
      <p>
        WatermarkPro xử lý ảnh trực tiếp, không nén quá mức,
        giúp watermark chữ hoặc logo mà vẫn giữ nguyên chất lượng ảnh.
      </p>

      <p className="font-medium">
        👉 Dùng thử ngay công cụ watermark ảnh không vỡ tại trang chủ.
      </p>
      {/* Nút quay về trang chủ */}
      <div className="pt-4">
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
        >
          ← Quay về trang chủ
        </Link>
      </div>
    </main>
  );
}
