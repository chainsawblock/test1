// components/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, User, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
 import { supabase } from "../lib/supabase/client";
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
    // первичная проверка
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };
    init();

    // подписка на изменение сессии
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error.message);
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

          {/* Навигация полностью убрана */}

          {/* Иконки справа: показ только после авторизации */}
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
