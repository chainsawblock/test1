// src/components/layout/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, User, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
import { getSupabaseClient } from "@/lib/supabase/client"; // если алиас не настроен: ../../lib/supabase/client
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/** Кнопка-иконка без бэкграунда/подсветок */
function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx(
        "p-2 h-9 w-9 inline-flex items-center justify-center",
        "bg-transparent rounded-none border-0 shadow-none",
        "hover:bg-transparent active:bg-transparent",
        "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
        "transition-none"
      )}
    >
      <span className="inline-flex text-[var(--header-fg)]">{children}</span>
    </button>
  );
}

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const supabase = getSupabaseClient();

        // первичная проверка пользователя
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        // подписка на изменения сессии
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            setIsAuthenticated(!!session?.user);
          }
        );
        unsubscribe = () => subscription.unsubscribe();
      } catch (err) {
        // если нет ENV или иная проблема — не падать, просто считаем, что не авторизован
        if (process.env.NODE_ENV !== "production") {
          console.error("Supabase init error:", (err as Error)?.message ?? err);
        }
      }
    })();

    return () => {
      try { unsubscribe?.(); } catch {}
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Logout error:", (err as Error)?.message ?? err);
      }
    }
  };

  return (
    <header
      className={clsx(
        "sticky top-0 z-50",
        "bg-[var(--header-bg)] text-[var(--header-fg)]",
        "border-b border-[var(--header-border)]/80",
        "backdrop-blur supports-[backdrop-filter]:bg-[color:var(--header-bg)]/95"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Логотип / бренд */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--brand)" }}
            >
              FullProof
            </div>
          </Link>

          {/* Навигацию убрали. Иконки — только после авторизации */}
          {isAuthenticated && (
            <div className="flex items-center gap-1">
              <IconButton label="Уведомления">
                <Bell size={18} />
              </IconButton>
              <IconButton label="Настройки">
                <Settings size={18} />
              </IconButton>
              <IconButton label="Профиль">
                <User size={18} />
              </IconButton>
              <IconButton label="Выйти" onClick={handleLogout}>
                <LogOut size={18} />
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

