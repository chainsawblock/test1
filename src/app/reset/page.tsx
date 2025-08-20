"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMsg("Если почта существует, письмо отправлено. Проверьте inbox/spam.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMsg(message || "Ошибка при отправке письма");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">Сброс пароля</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none ring-offset-0 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Отправляю…" : "Отправить ссылку на сброс"}
          </button>
          {msg && <p className="text-sm text-zinc-400">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
