import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormFlow - 설문조사 플랫폼",
  description: "구글폼 스타일의 설문조사 생성 및 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="no-js">
      <head>
        <link rel="stylesheet" href="/assets/css/bootstrap-5.0.0-beta1.min.css" />
        <link rel="stylesheet" href="/assets/css/LineIcons.2.0.css"/>
        <link rel="stylesheet" href="/assets/css/tiny-slider.css"/>
        <link rel="stylesheet" href="/assets/css/animate.css"/>
        <link rel="stylesheet" href="/assets/css/lindy-uikit.css"/>
      </head>
      <body className="antialiased">
        {children}
        <script src="/assets/js/bootstrap-5.0.0-beta1.min.js"></script>
        <script src="/assets/js/tiny-slider.js"></script>
        <script src="/assets/js/wow.min.js"></script>
        <script src="/assets/js/main.js"></script>
      </body>
    </html>
  );
}
