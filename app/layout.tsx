import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommerceMind.ai — สร้างสคริปต์ขายของด้วย AI",
  description:
    "เครื่องมือ AI สำหรับแม่ค้าและครีเอเตอร์ไทย สร้างสคริปต์วิดีโอสั้น Hook + Body ภายในไม่กี่วินาที",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
