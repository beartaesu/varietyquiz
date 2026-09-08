import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "버라이어티퀴즈",
    template: "%s | 버라이어티퀴즈",
  },
  description:
    "재미있는 VS와 월드컵에 참여하고 모두의 선택과 순위를 확인하는 참여형 콘텐츠 플랫폼입니다.",
  applicationName: "버라이어티퀴즈",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "버라이어티퀴즈",
    title: "버라이어티퀴즈",
    description: "나의 선택이 모두의 랭킹이 되는 참여형 콘텐츠 플랫폼",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
