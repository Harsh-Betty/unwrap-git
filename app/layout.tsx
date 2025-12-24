import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unwrap Git | Visualize Your Year in Code",
  description:
    "Transform your GitHub contributions into stunning 3D visualizations. Unwrap your coding year with beautiful terrain maps, commit analytics, and shareable wrapped summaries.",
  keywords: ["GitHub", "Wrapped", "contributions", "developer", "stats"],
  openGraph: {
    title: "Unwrap Git",
    description:
      "Transform your GitHub contributions into stunning 3D visualizations. Unwrap your coding year with beautiful terrain maps, commit analytics, and shareable wrapped summaries.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable}`}>
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
