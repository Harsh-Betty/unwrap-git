import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unwrap Git | Visualize Your Year in Code",
    short_name: "Unwrap Git",
    description:
      "Transform your GitHub contributions into stunning 3D visualizations. Unwrap your coding year with beautiful terrain maps, commit analytics, and shareable wrapped summaries.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#10b981",
    categories: ["developer tools", "productivity", "utilities"],
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
