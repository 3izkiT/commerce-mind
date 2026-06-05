import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "คิดคำขาย.com — สร้างสคริปต์ขายของด้วย AI",
  description:
    "ระบบจับคู่บริบทพาณิชย์และจิตวิทยาการขาย — เครื่องมือ AI สำหรับแม่ค้าและครีเอเตอร์ไทย สร้างสคริปต์วิดีโอสั้น Hook + Body ภายในไม่กี่วินาที",
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/favicon.svg" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${inter.variable} ${notoSansThai.variable} min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
