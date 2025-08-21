"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase/client";
import { toast } from "sonner";

export default function SecurityCard({ className = "" }: { className?: string }) {
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
    <div
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 ${className}`}
    >
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">Безопасность</h2>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/reset"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
          title="Сменить пароль"
        >
          <Shield size={18} />
          Сменить пароль
        </Link>

        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(161,161,170,0.20)] focus:shadow-[0_0_28px_rgba(161,161,170,0.25)]"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </div>
  );
}
