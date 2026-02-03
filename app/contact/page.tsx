import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liên hệ – WatermarkPro",
  description:
    "Liên hệ WatermarkPro để được hỗ trợ và góp ý.",
};

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Liên hệ</h1>

      <p>
        Nếu bạn cần hỗ trợ hoặc có góp ý cho WatermarkPro,
        vui lòng liên hệ qua email:
      </p>

      <p className="font-medium">
        📧 nvantri93@gmail.com
      </p>
    </main>
  );
}
