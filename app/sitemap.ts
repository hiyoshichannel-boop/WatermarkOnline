import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://watermarkpro.io.vn/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://watermarkpro.io.vn/privacy",
      lastModified: now,
      priority: 0.6,
    },
    {
      url: "https://watermarkpro.io.vn/contact",
      lastModified: now,
      priority: 0.6,
    },
    {
      url: "https://watermarkpro.io.vn/watermark-anh-khong-vo",
      lastModified: now,
      priority: 0.6,
    },
  ];
}
