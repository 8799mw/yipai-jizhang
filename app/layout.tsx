import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "一拍記帳",
  description: "不用打字，拍一下就記帳。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "一拍記帳",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#1f8a5b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
