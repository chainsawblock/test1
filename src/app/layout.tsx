// src/app/layout.tsx
import "./globals.css";

import Header from "@/components/layout/Header";
import ToastProvider from "@/features/notifications/toast/ToastProvider";
import NotificationsToaster from "@/features/notifications/NotificationsToaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-[var(--text)]">
        <ToastProvider>
          <Header />
          {/* Слушатель Realtime-тостов (по умолчанию только priority=high) */}
          <NotificationsToaster onlyHigh />
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
