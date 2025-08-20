"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase/client";

const authSchema = z.object({
  email: z.string().min(1, "Введите email").email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});
type FieldErrors = Partial<Record<"email" | "password", string>>;

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  // если уже залогинен — редиректим в профиль
  useEffect(() => {
    let ignore = false;
    (async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!ignore && data.session?.user) router.replace("/profile");
    })();
    return () => { ignore = true; };
  }, [router]);

  const validate = () => {
    const parsed = authSchema.safeParse({ email, password });
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const fieldErrs: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (k === "email" || k === "password") fieldErrs[k] = issue.message;
    }
    setErrors(fieldErrs);
    const first = parsed.error.issues[0]?.message ?? "Исправьте ошибки формы";
    toast.error("Ошибка валидации", { description: first });
    return false;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
        router.replace("/profile");
      } else {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback` },
        });
        if (error) throw error;
        toast.success("Регистрация успешна", {
          description: "Если включено подтверждение почты — проверьте письмо.",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Ошибка авторизации";
      toast.error("Не удалось выполнить операцию", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm text-zinc-400">Email</label>
            <input
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                errors.email
                  ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                  : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
              }`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-zinc-400">Пароль</label>
            <input
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                errors.password
                  ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                  : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
              }`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              placeholder="Минимум 6 символов"
              required
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setMode((m) => (m === "login" ? "signup" : "login"));
              }}
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-medium text-zinc-200 hover:bg-zinc-900"
            >
              {mode === "login"
                ? "Нет аккаунта? Зарегистрироваться"
                : "Уже есть аккаунт? Войти"}
            </button>
            <p className="text-center text-sm">
              <Link href="/reset">Забыли пароль?</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
