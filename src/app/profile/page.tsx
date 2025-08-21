"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase/client";

type Profile = {
  username: string | null;
  contact_type: string | null;
  contact_value: string | null;
  invite_code: string | null;
  invite_bonus_usd_cents: number | null;
  created_at: string | null;
};

function formatUSD(cents?: number | null) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!redirected.current) {
          redirected.current = true;
          router.replace("/auth");
        }
        return;
      }

      if (cancelled) return;
      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, contact_type, contact_value, invite_code, invite_bonus_usd_cents, created_at")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Не удалось загрузить профиль");
      }

      if (cancelled) return;
      setProfile((data ?? null) as Profile | null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Вы вышли из профиля");
      router.replace("/auth");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось выйти";
      toast.error("Ошибка выхода", { description: msg });
    }
  };

  function RedeemInline() {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const schema = z.object({ code: z.string().min(3, "Минимум 3 символа") });

    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      const chk = schema.safeParse({ code });
      if (!chk.success) {
        toast.error("Ошибка", { description: chk.error.issues[0]?.message });
        return;
      }
      setSubmitting(true);
      try {
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

          setProfile((p) =>
            p
              ? {
                  ...p,
                  invite_code: code.trim(),
                  invite_bonus_usd_cents: (p.invite_bonus_usd_cents ?? 0) + (data.bonus_usd_cents ?? 0),
                }
              : p
          );

          setShowRedeem(false);
          setCode("");
          router.refresh();
        } else {
          toast.error("Не удалось применить", { description: data?.message ?? "unknown_error" });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ошибка";
        toast.error("Не удалось применить код", { description: msg });
      } finally {
        setSubmitting(false);
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
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 hover:bg-zinc-300 disabled:opacity-60"
        >
          {submitting ? "Применяем…" : "Применить код"}
        </button>
      </form>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6 backdrop-blur card-elev animate-pulse">
          <div className="h-6 w-40 rounded bg-zinc-800" />
          <div className="mt-6 space-y-3">
            <div className="h-5 w-full rounded bg-zinc-800" />
            <div className="h-5 w-2/3 rounded bg-zinc-800" />
            <div className="h-5 w-3/4 rounded bg-зinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!userEmail) return null;

  const inviteApplied = Boolean(profile?.invite_code);

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6 backdrop-blur card-elev">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-100">Профиль</h1>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRedeem((v) => !v)}
              disabled={inviteApplied}
              title={inviteApplied ? "Код уже применён" : "Применить инвайт-код"}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                inviteApplied
                  ? "cursor-not-allowed border border-zinc-800 bg-zinc-950 text-zinc-500"
                  : "bg-zinc-200 text-zinc-900 hover:bg-zinc-300"
              }`}
            >
              {inviteApplied ? "Код применён" : showRedeem ? "Скрыть инвайт" : "Применить инвайт"}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
            >
              Выйти
            </button>
          </div>
        </div>

        <dl className="space-y-3 text-zinc-200">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Email</dt>
            <dd className="font-medium">{userEmail}</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Логин</dt>
            <dd className="font-medium">{profile?.username ?? "—"}</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Связь</dt>
            <dd className="font-medium">
              {profile?.contact_type ? `${profile.contact_type}: ${profile.contact_value || "—"}` : "—"}
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Инвайт-код</dt>
            <dd className="font-medium">{profile?.invite_code ?? "—"}</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Бонус</dt>
            <dd className="font-medium">{formatUSD(profile?.invite_bonus_usd_cents)}</dd>
          </div>
        </dl>

        {showRedeem && !inviteApplied && <RedeemInline />}
      </div>
    </div>
  );
}

// маркер, чтобы TS трактовал файл как модуль
export const __isModule = true;
