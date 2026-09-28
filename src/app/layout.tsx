import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "프렙 카페 · 운영 기록",
  description: "카페 판매 입력과 일자별 집계를 확인합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
