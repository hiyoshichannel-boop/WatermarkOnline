import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// ================= FONT =================
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ================= GA ID =================
const GA_ID = "G-K866WSXRB3"; // 👉 có thể chuyển sang env nếu muốn

// ================= METADATA =================
export const metadata: Metadata = {
  metadataBase: new URL("https://watermarkpro.io.vn"),

  title: {
    default: "WatermarkPro – Chèn Watermark Ảnh Online Miễn Phí",
    template: "%s | WatermarkPro",
  },

  description:
    "WatermarkPro giúp bạn chèn watermark chữ hoặc icon vào ảnh online nhanh chóng. Hỗ trợ tiếng Việt, resize watermark, chọn vị trí, độ mờ. Miễn phí, không cần đăng ký.",

  keywords: [
    "watermark ảnh",
    "chèn watermark",
    "watermark online",
    "đóng dấu ảnh",
    "chèn logo vào ảnh",
    "watermark chữ",
    "watermark icon",
    "resize watermark",
    "watermark tiếng Việt",
    "watermarkpro",
  ],

  authors: [{ name: "WatermarkPro" }],
  creator: "WatermarkPro",
  publisher: "WatermarkPro",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://watermarkpro.io.vn",
    siteName: "WatermarkPro",
    title: "WatermarkPro – Chèn Watermark Ảnh Online Miễn Phí",
    description:
      "Công cụ chèn watermark ảnh online: chữ & icon, resize watermark, chọn vị trí, hỗ trợ tiếng Việt. Dùng miễn phí, không cần đăng ký.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WatermarkPro – Chèn Watermark Ảnh Online",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "WatermarkPro – Chèn Watermark Ảnh Online",
    description:
      "Chèn watermark chữ hoặc logo vào ảnh online nhanh chóng. Hỗ trợ tiếng Việt, resize watermark, miễn phí.",
    images: ["/og-image.png"],
  },

  alternates: {
    canonical: "https://watermarkpro.io.vn",
  },

  category: "technology",
};

// ================= ROOT LAYOUT =================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* ===== Google Analytics GA4 ===== */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* ===== Vercel Analytics (optional) ===== */}
        <Analytics />
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "WatermarkPro",
      operatingSystem: "Web",
      applicationCategory: "MultimediaApplication",
      description:
        "Công cụ chèn watermark ảnh online miễn phí, không lưu ảnh.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "VND",
      },
    }),
  }}
/>

      </body>
    </html>
  );
}

