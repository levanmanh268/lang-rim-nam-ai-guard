import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Làng Rim Nam AI Guard",
  description: "Kỹ năng chống lừa đảo trên Internet - phân tích link và tin nhắn bằng Gemini AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lang-rim-nam-ai-guard.vercel.app"),
  openGraph: {
    title: "Làng Rim Nam AI Guard",
    description: "Công cụ AI giúp nhận diện lừa đảo trực tuyến cho cộng đồng.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
