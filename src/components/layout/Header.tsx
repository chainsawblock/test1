"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "../../lib/supabase/client";

export default function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const isProfile = pathname?.startsWith("/profile");
  const router = useRouter();
  const supabase = getSupabaseClient();

  const onSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth");
    } catch (e) {
      toast.error("Не удалось выйти", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Лого/название слева */}
        <Link
          href="/"
          className="font-semibold tracking-tight text-zinc-100 hover:text-white"
        >
          {siteName}
        </Link>

        {/* Правый блок */}
        <div className="flex items-center gap-2">
          {isProfile ? (
            <>
              {/* Иконка профиля (активная на /profile) */}
              <Link
                href="/profile"
                aria-label="Профиль"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border
                  ${pathname === "/profile"
                    ? "border-zinc-600 bg-zinc-900 text-zinc-100"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white"
                  }`}
                title="Профиль"
              >
                <User size={18} />
              </Link>

              {/* Иконка выхода */}
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Выйти"
                title="Выйти"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:shadow-[0_0_18px_rgba(161,161,170,0.18)] focus:shadow-[0_0_18px_rgba(161,161,170,0.22)]"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            // На остальных страницах можно оставить старое меню
            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/auth" className="hover:text-zinc-200">Вход</Link>
              <Link href="/reset" className="hover:text-zinc-200">Сброс</Link>
              <Link href="/profile" className="hover:text-zinc-200">Профиль</Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
