import { redirect } from "next/navigation";
import { getServerSupabase } from "../../lib/supabase/server";
import RedeemInvite from "../../components/profile/RedeemInvite";

export const dynamic = "force-dynamic";

function formatUSD(cents?: number | null) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

export default async function ProfilePage() {
  const supabase = await getServerSupabase();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, contact_type, contact_value, invite_code, invite_bonus_usd_cents, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6 backdrop-blur card-elev">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">Профиль</h1>

        <dl className="space-y-3 text-zinc-200">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Email</dt>
            <dd className="font-medium">{user.email}</dd>
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

        {!profile?.invite_code && (
          <RedeemInvite />
        )}
      </div>
    </div>
  );
}
