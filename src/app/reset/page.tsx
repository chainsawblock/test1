"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase/client";

const emailSchema = z.object({
  email: z.string().min(1, "Введите email").email("Неверный email"),
});


export default function ResetPage() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Проверьте email";
      setError(msg);
      toast.error("Ошибка валидации", { description: msg });
      return;
    }
    setError(null);

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (err) throw err;
      toast.success("Письмо отправлено", {
        description: "Если почта существует, проверьте входящие и спам.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Ошибка отправки письма";
      toast.error("Не удалось отправить письмо", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">Сброс пароля</h1>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm text-zinc-400">Email</label>
            <input
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                error ? "border-red-500 bg-zinc-950 focus:ring-red-600" : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
              }`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-email-error" : undefined}
            />
            {error && <p id="reset-email-error" className="mt-1 text-sm text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Отправляю…" : "Отправить ссылку на сброс"}
          </button>
        </form>
      </div>
    </div>
  );
}
