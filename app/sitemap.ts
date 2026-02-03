import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://watermarkpro.io.vn/",
      lastModified: new Date(),
    },
    {
      url: "https://watermarkpro.io.vn/privacy",
      lastModified: new Date(),
    },
    {
      url: "https://watermarkpro.io.vn/contact",
      lastModified: new Date(),
    },
  ];
}
