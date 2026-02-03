import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – WatermarkPro",
  description:
    "Chính sách bảo mật của WatermarkPro. Chúng tôi không lưu trữ ảnh, đảm bảo quyền riêng tư tuyệt đối cho người dùng.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>

      <p>
        WatermarkPro không lưu trữ hình ảnh của người dùng.
        Tất cả ảnh chỉ được xử lý tạm thời để tạo watermark.
      </p>

      <p>
        Sau khi xử lý xong, dữ liệu sẽ được xoá tự động khỏi hệ thống.
      </p>
    </main>
  );
}
