import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/layout/Header";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "FullProof";

export const metadata: Metadata = {
  title: siteName,
  description: "Авторизация и профиль на Supabase",
  applicationName: siteName,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-zinc-950 text-zinc-100">
        <Header siteName={siteName} />
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}


