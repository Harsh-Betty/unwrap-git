import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitHub Unwrapped 2025 | Your Year in Code",
  description:
    "Discover your GitHub contribution stats for 2025. See your commits, PRs, top languages, and more in a retro terminal aesthetic.",
  keywords: [
    "GitHub",
    "Wrapped",
    "2025",
    "contributions",
    "developer",
    "stats",
  ],
  openGraph: {
    title: "GitHub Unwrapped 2025",
    description: "Your Year in Code - Spotify Wrapped style for GitHub",
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
