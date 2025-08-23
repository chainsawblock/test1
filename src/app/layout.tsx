// app/layout.tsx
import "./globals.css";
import Header from "@/components/layout/Header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-[var(--text)]">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}

