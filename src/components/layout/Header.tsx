"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Settings, LogOut } from "lucide-react";
import clsx from "clsx";

import { getSupabaseClient } from "@/lib/supabase/client";
import { NotificationsButton } from "../../features/notifications/NotificationsButton";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

function IconButton({
  label,
  children,
  onClick,
  variant = "default",
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx(
        "p-2 h-9 w-9 inline-flex items-center justify-center",
        "bg-transparent rounded-none border-0 shadow-none",
        "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
        "transition-colors duration-150",
        // базовый цвет для всех иконок
        "text-[#9e9e9e]",
        variant === "default" && "hover:text-white/90 active:text-white",
        variant === "danger" && "hover:text-rose-500 active:text-rose-500 focus-visible:text-rose-500"
      )}
    >
      {children}
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
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            setIsAuthenticated(!!session?.user);
          }
        );
        unsubscribe = () => subscription.unsubscribe();
      } catch (e) {
        if (process.env.NODE_ENV !== "production") console.error(e);
      }
    })();
    return () => { try { unsubscribe?.(); } catch {} };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(e);
    }
  };

  return (
    <header
      className={clsx(
        "sticky top-0 z-50",
        "bg-[var(--header-bg)]",
        "border-b border-[var(--header-border)]/80",
        "backdrop-blur supports-[backdrop-filter]:bg-[color:var(--header-bg)]/95"
      )}
    >
      {/* ↓ было max-w-7xl — сделал чуть уже */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* серый заголовок бренда */}
            <div className="text-base font-semibold tracking-tight text-[#9e9e9e]">
              FullProof
            </div>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-1">
              <NotificationsButton />
              <IconButton label="Настройки">
                <Settings size={18} />
              </IconButton>
              <IconButton label="Профиль">
                <User size={18} />
              </IconButton>
              <IconButton label="Выйти" onClick={handleLogout} variant="danger">
                <LogOut size={18} />
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

