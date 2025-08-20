"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [stage, setStage] = useState<"loading" | "recovery" | "error">("loading");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseClient();

        // 1) OAuth/PKCE: ?code=...
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) { setMsg(error.message); setStage("error"); return; }
          router.replace("/profile");
          return;
        }

        // 2) Email links (confirm/recovery/magic): токены в hash
        const hash = window.location.hash || "";
        const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        const type = hashParams.get("type"); // "recovery" | "signup" | "magiclink"

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) { setMsg(error.message); setStage("error"); return; }
        }

        if (type === "recovery") { setStage("recovery"); return; }

        const { data } = await supabase.auth.getSession();
        if (data.session?.user) { router.replace("/profile"); return; }

        setMsg("Не удалось обработать ссылку. Проверьте Redirect URL в настройках Supabase.");
        setStage("error");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setMsg(message || "Не удалось обработать ссылку");
        setStage("error");
      }
    })();
  }, [router, search]);

  const updatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Пароль обновлён. Входим…");
      router.replace("/profile");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMsg(message || "Не удалось обновить пароль");
    }
  };

  if (stage === "loading") return <div className="text-center text-zinc-400">Обработка ссылки…</div>;

  if (stage === "recovery") {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
          <h1 className="mb-4 text-2xl font-semibold text-zinc-100">Новый пароль</h1>
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400">Пароль</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-600"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
            >
              Обновить пароль
            </button>
            {msg && <p className="text-sm text-zinc-400">{msg}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
        <h1 className="mb-3 text-2xl font-semibold text-zinc-100">Ошибка</h1>
        <p className="text-zinc-300">{msg ?? "Не удалось обработать ссылку."}</p>
        <p className="mt-3 text-zinc-400">
          Вернуться на <a href="/auth">страницу входа</a>.
        </p>
      </div>
    </div>
  );
}
