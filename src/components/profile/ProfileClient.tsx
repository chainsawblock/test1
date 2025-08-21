"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseClient } from "../../lib/supabase/client";
import ProfileCard from "./ProfileCard";
import BalanceCard from "./BalanceCard";
import SecurityCard from "./SecurityCard";

type ContactType = "telegram" | "jabber" | "tox" | null;

type ProfileRow = {
  username: string | null;
  contact_type: ContactType;
  contact_value: string | null;
  invite_code: string | null;
  invite_bonus_usd_cents: number | null;
  created_at: string;
};

export default function ProfileClient() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const user = sess.session?.user;
        if (!user) {
          router.replace("/auth");
          return;
        }
        if (ignore) return;
        setEmail(user.email ?? "");

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "username, contact_type, contact_value, invite_code, invite_bonus_usd_cents, created_at"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!ignore) setProfile((data as ProfileRow) ?? null);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Не удалось загрузить профиль";
        toast.error("Ошибка загрузки", { description: msg });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="md:col-span-2" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6">
        <p className="text-zinc-300">Профиль не найден.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ProfileCard
        email={email}
        username={profile.username ?? "-"}
        contactType={profile.contact_type}
        contactValue={profile.contact_value ?? "-"}
        createdAt={profile.created_at}
        inviteCode={profile.invite_code}
      />
      <BalanceCard
        bonusUsdCents={profile.invite_bonus_usd_cents ?? 0}
        inviteCode={profile.invite_code}
      />
      <SecurityCard className="md:col-span-2" />
    </div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 ${className}`}
    >
      <div className="h-5 w-40 animate-pulse rounded bg-zinc-800/70" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-800/70" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-zinc-800/70" />
      <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-zinc-800/70" />
      <div className="mt-6 h-9 w-32 animate-pulse rounded-xl bg-zinc-800/70" />
    </div>
  );
}
