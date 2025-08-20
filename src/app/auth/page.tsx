"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10v4h5.6A5.9 5.9 0 1 1 12 6.1a5.7 5.7 0 0 1 3.9 1.5l2.7-2.7A10 10 0 1 0 22 12c0-.7-.1-1.3-.2-2H12z"/>
      <path fill="#34A853" d="M3.5 14.1a6 6 0 0 0 8.5 4.4l-3.3-2.6a3.6 3.6 0 0 1-5.2-1.8z"/>
      <path fill="#4A90E2" d="M12 22a9.9 9.9 0 0 0 7-2.7l-3.2-2.5A6 6 0 0 1 3.5 14l-3.2 2.5A10 10 0 0 0 12 22z" opacity=".2"/>
      <path fill="#FBBC05" d="M6.9 8.1 3.7 5.6A10 10 0 0 0 2 12c0 1 .2 1.9.5 2.8л3.2-2.6a6 6 0 0 1 1.2-4.1z"/>
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // если уже залогинен — не показываем форму
  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!ignore && data.session?.user) router.replace("/profile");
    })();
    return () => { ignore = true; };
  }, [router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/profile");
      } else {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback` },
        });
        if (error) throw error;
        setMsg("Регистрация успешна! Если требуется подтверждение — проверьте почту.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMsg(message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setOauthLoading(true);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setMsg(message || "Не удалось запустить OAuth");
      setOauthLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        <div className="mb-6">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={oauthLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-medium text-zinc-100 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon className="h-4 w-4" />
            {oauthLoading ? "…" : "Войти через Google"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-zinc-500">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs">или email</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none ring-offset-0 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400">Пароль</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none ring-offset-0 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-600"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              placeholder="Минимум 6 символов"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          {msg && <p className="text-sm text-red-400">{msg}</p>}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-medium text-zinc-200 hover:bg-zinc-900"
            >
              {mode === "login"
                ? "Нет аккаунта? Зарегистрироваться"
                : "Уже есть аккаунт? Войти"}
            </button>
            <p className="mt-3 text-center text-sm">
              <Link href="/reset">Забыли пароль?</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
