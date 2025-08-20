import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ToasterProvider from "../components/Toaster"; // ⬅️ ДОБАВЬ

export const metadata: Metadata = {
  title: "Auth • Next.js + Supabase",
  description: "Стартовый проект аутентификации (тёмная тема)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body>
        <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-900/70 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-zinc-200">Auth Demo</Link>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/auth">Auth</Link>
              <Link href="/reset">Сброс</Link>
              <Link href="/profile">Профиль</Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto min-h-[calc(100dvh-64px)] max-w-5xl px-4 py-10">
          {children}
        </main>

        <ToasterProvider /> {/* ⬅️ Глобальные тосты */}
      </body>
    </html>
  );
}

