"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseClient } from "../../lib/supabase/client";
import RedeemInvite from "./RedeemInvite";

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

export default function ProfileClient() {
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

      const { data } = await supabase
        .from("profiles")
        .select("username, contact_type, contact_value, invite_code, invite_bonus_usd_cents, created_at")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(data ?? null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
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

  if (loading) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6 backdrop-blur card-elev animate-pulse">
          <div className="h-6 w-40 rounded bg-zinc-800" />
          <div className="mt-6 space-y-3">
            <div className="h-5 w-full rounded bg-zinc-800" />
            <div className="h-5 w-2/3 rounded bg-zinc-800" />
            <div className="h-5 w-3/4 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!userEmail) return null; // редирект уже запущен

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

        {/* Форма ввода инвайта — по кнопке, и только если код ещё не применён */}
        {showRedeem && !inviteApplied && (
          <RedeemInvite
            onSuccess={() => {
              // после успешного погашения — схлопываем форму и обновляем данные
              setShowRedeem(false);
              router.refresh();
              setProfile((p) => (p ? { ...p, invite_code: "applied" } : p));
            }}
          />
        )}
      </div>
    </div>
  );
}

// маркер, чтобы TS точно трактовал файл как модуль
export const __isModule = true;
