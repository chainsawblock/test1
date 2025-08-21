"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase/client";

// ── Схемы валидации ────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, "Введите email").email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

const signupSchema = z
  .object({
    email: z.string().min(1, "Введите email").email("Неверный email"),
    username: z
      .string()
      .min(3, "Логин от 3 символов")
      .max(20, "Логин до 20 символов")
      .regex(
        /^[A-Za-z][A-Za-z0-9_]{2,19}$/,
        "Логин: латиница/цифры/нижнее подчёркивание, начинается с буквы"
      ),
    password: z.string().min(6, "Минимум 6 символов"),
    password2: z.string().min(6, "Минимум 6 символов"),
    contactType: z.enum(["none", "telegram", "jabber", "tox"]),
    contactValue: z.string().optional(),
    inviteCode: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.password2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password2"],
        message: "Пароли не совпадают",
      });
    }
    if (v.contactType !== "none") {
      const val = (v.contactValue ?? "").trim();
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contactValue"],
          message: "Укажите контакт",
        });
      }
    }
  });

type FieldErrors = Partial<
  Record<
    | "email"
    | "password"
    | "password2"
    | "username"
    | "contactType"
    | "contactValue"
    | "inviteCode",
    string
  >
>;

// ── Компонент формы ────────────────────────────────────────────────────────────

export default function AuthForm() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");

  // Общие поля
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Только для регистрации
  const [password2, setPassword2] = useState("");
  const [username, setUsername] = useState("");
  const [contactType, setContactType] = useState<"none" | "telegram" | "jabber" | "tox">("none");
  const [contactValue, setContactValue] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  // Уже залогинен? — уводим в профиль
  useEffect(() => {
    let ignore = false;
    (async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!ignore && data.session?.user) router.replace("/profile");
    })();
    return () => {
      ignore = true;
    };
  }, [router]);

  // Валидация перед submit
  const validate = () => {
    if (mode === "login") {
      const parsed = loginSchema.safeParse({ email, password });
      if (parsed.success) {
        setErrors({});
        return true;
      }
      const fieldErrs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string") fieldErrs[k as keyof FieldErrors] = issue.message;
      }
      setErrors(fieldErrs);
      toast.error("Ошибка валидации", { description: parsed.error.issues[0]?.message });
      return false;
    }

    const parsed = signupSchema.safeParse({
      email,
      username,
      password,
      password2,
      contactType,
      contactValue,
      inviteCode,
    });
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const fieldErrs: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrs[k as keyof FieldErrors] = issue.message;
    }
    setErrors(fieldErrs);
    toast.error("Ошибка валидации", { description: parsed.error.issues[0]?.message });
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
        return;
      }

      // mode === "signup"
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const meta = {
        username: username.trim(),
        contact_type: contactType === "none" ? null : contactType,
        contact_value: contactType === "none" ? null : contactValue.trim(),
        invite_code: inviteCode.trim() || null,
      } as const;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: meta, // ← эти поля поймает наш триггер и создаст запись в public.profiles
        },
      });

      if (error) {
        const msg = String(error.message || error);
        // Если БД вернула ошибку уникальности по username — подскажем красиво
        if (/username|duplicate|unique/i.test(msg)) {
          setErrors((e) => ({ ...e, username: "Этот логин уже занят" }));
        }
        throw error;
      }

      toast.success("Регистрация успешна", {
        description:
          "Если включено подтверждение почты — проверьте письмо и перейдите по ссылке.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Ошибка авторизации";
      toast.error("Не удалось выполнить операцию", { description: message });
    } finally {
      setLoading(false);
    }
  };

  // ── Рендер ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-6 backdrop-blur card-elev">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-100">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Email */}
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
              <p id="email-error" className="mt-1 text-sm text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Для регистрации показываем дополнительные поля */}
          {mode === "signup" && (
            <>
              {/* Логин */}
              <div>
                <label className="block text-sm text-zinc-400">Логин</label>
                <input
                  className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                    errors.username
                      ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                      : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                  }`}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="например, john_doe"
                  autoComplete="username"
                  required
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
                {errors.username && (
                  <p id="username-error" className="mt-1 text-sm text-red-400">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Контакты: тип + значение (условно обязательно) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-zinc-400">Связь</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600"
                    value={contactType}
                    onChange={(e) =>
                      setContactType(e.target.value as "none" | "telegram" | "jabber" | "tox")
                    }
                  >
                    <option value="none">Не указывать</option>
                    <option value="telegram">Telegram</option>
                    <option value="jabber">Jabber</option>
                    <option value="tox">TOX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400">
                    {contactType === "telegram"
                      ? "Ник в Telegram"
                      : contactType === "jabber"
                      ? "Jabber (user@domain)"
                      : contactType === "tox"
                      ? "TOX ID"
                      : "Контакт (опционально)"}
                  </label>
                  <input
                    className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                      errors.contactValue
                        ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                        : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                    }`}
                    type="text"
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={
                      contactType === "telegram"
                        ? "@username"
                        : contactType === "jabber"
                        ? "user@domain"
                        : contactType === "tox"
                        ? "TOX…"
                        : "необязательно"
                    }
                    aria-invalid={Boolean(errors.contactValue)}
                    aria-describedby={errors.contactValue ? "contact-error" : undefined}
                  />
                  {errors.contactValue && (
                    <p id="contact-error" className="mt-1 text-sm text-red-400">
                      {errors.contactValue}
                    </p>
                  )}
                </div>
              </div>

              {/* Инвайт-код (необязателен) */}
              <div>
                <label className="block text-sm text-zinc-400">Инвайт-код (опционально)</label>
                <input
                  className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                    errors.inviteCode
                      ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                      : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                  }`}
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Например: INV123"
                  aria-invalid={Boolean(errors.inviteCode)}
                  aria-describedby={errors.inviteCode ? "invite-error" : undefined}
                />
                {errors.inviteCode && (
                  <p id="invite-error" className="mt-1 text-sm text-red-400">
                    {errors.inviteCode}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Пароль */}
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
              <p id="password-error" className="mt-1 text-sm text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Повтор пароля — только при регистрации */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-zinc-400">Повтор пароля</label>
              <input
                className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                  errors.password2
                    ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                    : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                }`}
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                minLength={6}
                placeholder="Повторите пароль"
                required
                aria-invalid={Boolean(errors.password2)}
                aria-describedby={errors.password2 ? "password2-error" : undefined}
              />
              {errors.password2 && (
                <p id="password2-error" className="mt-1 text-sm text-red-400">
                  {errors.password2}
                </p>
              )}
            </div>
          )}

          {/* Кнопки */}
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
