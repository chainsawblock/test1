"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase/client";

const otpSchema = z.object({
  email: z.string().email("Неверный email"),
  code: z.string().regex(/^\d{6}$/, "Код из 6 цифр"),
});

export default function VerifySignup({ defaultEmail = "" }: { defaultEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const check = otpSchema.safeParse({ email, code });
    if (!check.success) {
      const msg = check.error.issues[0]?.message ?? "Проверьте email и код";
      toast.error("Ошибка валидации", { description: msg });
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // Подтверждение регистрации по email OTP (6-значный код)
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) throw error;

      if (data?.session) {
        toast.success("Email подтверждён");
        router.replace("/profile");
      } else {
        toast.success("Email подтверждён. Войдите с паролем.");
        router.replace("/auth");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Неверный или просроченный код";
      toast.error("Не удалось подтвердить", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) {
      toast.error("Укажите email");
      return;
    }
    setResending(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("Код отправлен повторно");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не удалось отправить код";
      toast.error("Ошибка", { description: msg });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6 backdrop-blur card-elev">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">Подтвердите email</h1>
        <p className="mb-4 text-sm text-zinc-400">
          Мы отправили 6-значный код на{" "}
          <span className="text-zinc-200">{email || "ваш email"}</span>.
        </p>

        <form onSubmit={onVerify} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm text-zinc-400">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Код из письма */}
          <div>
            <label className="block text-sm text-zinc-400">Код из письма</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600 tracking-widest text-center"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 disabled:opacity-60"
          >
            {loading ? "Проверяем…" : "Подтвердить"}
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-medium text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"
          >
            {resending ? "Отправляем…" : "Отправить код ещё раз"}
          </button>
        </form>
      </div>
    </div>
  );
}
