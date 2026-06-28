import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  preload: true,
});

export const metadata: Metadata = {
  title: "N2 学習システム",
  description: "JLPT N2 対策のための総合学習プラットフォーム",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "N2 学習",
  },
};

export const viewport: Viewport = {
  themeColor: "#c45c5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full`}>
      <body className="min-h-full bg-surface font-sans text-zinc-900 antialiased dark:text-zinc-100">
        <AuthProvider>
          <ServiceWorkerRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
