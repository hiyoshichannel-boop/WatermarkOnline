import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Liên hệ – WatermarkPro",
  description:
    "Liên hệ WatermarkPro để được hỗ trợ và góp ý.",
};

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Liên hệ</h1>

      <p>
        Nếu bạn cần hỗ trợ hoặc có góp ý cho WatermarkPro,
        vui lòng liên hệ qua email:
      </p>

      <p className="font-medium text-blue-600">
        📧 nvantri93@gmail.com
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
