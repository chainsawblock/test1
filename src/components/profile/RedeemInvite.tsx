"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase/client";

const schema = z.object({ code: z.string().min(3, "Минимум 3 символа") });

export default function RedeemInvite({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chk = schema.safeParse({ code });
    if (!chk.success) {
      toast.error("Ошибка", { description: chk.error.issues[0]?.message });
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // Проверим, что есть сессия — иначе RPC вернёт "No authorization token..."
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast.error("Нужна авторизация", { description: "Войдите и повторите попытку." });
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase.rpc("redeem_invite", { p_code: code.trim() });
      if (error) throw error;

      if (data?.ok) {
        const usd = (data.bonus_usd_cents / 100).toFixed(2);
        toast.success("Инвайт подтверждён", { description: `Начислено: $${usd}` });
        setCode("");
        onSuccess?.();
        router.refresh();
      } else {
        toast.error("Не удалось применить", { description: data?.message ?? "unknown_error" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка";
      toast.error("Не удалось применить код", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <label className="block text-sm text-zinc-400">Инвайт-код</label>
      <input
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="например: VIP200"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 hover:bg-zinc-300 disabled:opacity-60"
      >
        {loading ? "Применяем…" : "Применить код"}
      </button>
    </form>
  );
}
