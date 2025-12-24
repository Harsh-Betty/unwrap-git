import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: "https://unwrap-git.hrshvrdhn.com/sitemap.xml",
    host: "https://unwrap-git.hrshvrdhn.com",
  };
}
