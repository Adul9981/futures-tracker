import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "合约交易统计",
  description: "加密合约交易记录统计工具",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col antialiased bg-slate-900">{children}</body>
    </html>
  );
}
