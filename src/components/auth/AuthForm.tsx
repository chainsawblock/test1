"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import PasswordStrength from "./PasswordStrength";
import { getSupabaseClient } from "../../lib/supabase/client";

type Mode = "login" | "signup";
type ContactType = "none" | "telegram" | "jabber" | "tox";

type FieldErrors = Partial<
  Record<"email" | "password" | "confirm" | "username" | "contact_value" | "invite_code", string>
>;

const baseSchema = z.object({
  email: z.string().min(1, "Введите email").email("Неверный email"),
  password: z.string().min(1, "Введите пароль"),
});

const signupSchema = baseSchema
  .extend({
    confirm: z.string().min(1, "Повторите пароль"),
    username: z
      .string()
      .min(3, "Логин минимум 3 символа")
      .max(24, "Максимум 24 символа")
      .regex(/^[A-Za-z0-9_]+$/, "Только латиница, цифры и _"),
    contact_type: z.enum(["none", "telegram", "jabber", "tox"]),
    contact_value: z.string().optional(),
    invite_code: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirm) {
      ctx.addIssue({ code: "custom", path: ["confirm"], message: "Пароли не совпадают" });
    }
    if (val.contact_type !== "none" && !val.contact_value?.trim()) {
      ctx.addIssue({ code: "custom", path: ["contact_value"], message: "Укажите контакт" });
    }
  });

function checkPasswordRules(pw: string) {
  const errs: string[] = [];
  if (pw.length < 8) errs.push("Минимум 8 символов");
  if (!/[a-z]/.test(pw)) errs.push("Нужна строчная буква");
  if (!/[A-Z]/.test(pw)) errs.push("Нужна заглавная буква");
  if (!/\d/.test(pw)) errs.push("Нужна цифра");
  return { ok: errs.length === 0, errs };
}

export default function AuthForm() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [mode, setMode] = useState<Mode>("login");

  // общие поля
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // регистрация
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [contactType, setContactType] = useState<ContactType>("none");
  const [contactValue, setContactValue] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // если уже залогинен — редиректим в профиль
  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!ignore && data.session?.user) router.replace("/profile");
    })();
    return () => {
      ignore = true;
    };
  }, [router, supabase]);

  const validate = () => {
    const parsed =
      mode === "login"
        ? baseSchema.safeParse({ email, password })
        : signupSchema.safeParse({
            email,
            password,
            confirm,
            username,
            contact_type: contactType,
            contact_value: contactValue,
            invite_code: inviteCode,
          });

    if (parsed.success) {
      if (mode === "signup") {
        const { ok, errs } = checkPasswordRules(password);
        if (!ok) {
          setErrors({ password: errs.join(" · ") });
          toast.error("Пароль слишком слабый", { description: errs.join(" · ") });
          return false;
        }
      }
      setErrors({});
      return true;
    }

    const fieldErrs: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof FieldErrors;
      fieldErrs[k] = issue.message;
    }
    setErrors(fieldErrs);
    toast.error("Ошибка валидации", {
      description: parsed.error.issues[0]?.message ?? "Проверьте поля формы",
    });
    return false;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
        router.replace("/profile");
      } else {
        const meta = {
          username: username.trim(),
          contact_type: contactType === "none" ? null : contactType,
          contact_value: contactType === "none" ? null : contactValue.trim() || null,
          invite_code: inviteCode.trim() || null,
        } as const;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: meta }, // OTP код придёт на почту
        });
        if (error) throw error;

        toast.success("Регистрация успешна", {
          description: "Мы отправили 6-значный код на вашу почту. Введите его на следующем шаге.",
        });
        router.replace(`/auth/verify?email=${encodeURIComponent(email)}`);
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
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-100">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setErrors({});
            }}
            className="text-sm font-medium text-zinc-300 hover:text-white"
          >
            {mode === "login" ? "Создать аккаунт" : "У меня уже есть аккаунт"}
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* 1) Email — общий */}
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
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* 2) Логин — только регистрация */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-zinc-400">Логин</label>
              <input
                className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                  errors.username
                    ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                    : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="например: neo_1337"
                required
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? "username-error" : undefined}
                autoComplete="username"
              />
              {errors.username && (
                <p id="username-error" className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>
          )}

          {/* 3) Пароль — общий (индикатор только при регистрации) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm text-zinc-400">Пароль</label>
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                {showPwd ? "Скрыть" : "Показать"}
              </button>
            </div>
            <input
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                errors.password
                  ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                  : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
              }`}
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Минимум 8 символов" : "Ваш пароль"}
              required
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
            {mode === "signup" && (
              <PasswordStrength password={password} userInputs={[email, username]} />
            )}
          </div>

          {/* 4) Повтор пароля — только регистрация */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-zinc-400">Повторите пароль</label>
              <input
                className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                  errors.confirm
                    ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                    : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                }`}
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ещё раз пароль"
                required
                aria-invalid={Boolean(errors.confirm)}
                aria-describedby={errors.confirm ? "confirm-error" : undefined}
                minLength={8}
                autoComplete="new-password"
              />
              {errors.confirm && (
                <p id="confirm-error" className="mt-1 text-sm text-red-400">{errors.confirm}</p>
              )}
            </div>
          )}

          {/* 5) Связь — только регистрация */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-zinc-400">Связь</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <select
                  className="col-span-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600"
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as ContactType)}
                >
                  <option value="none">Не указывать</option>
                  <option value="telegram">Telegram</option>
                  <option value="jabber">Jabber</option>
                  <option value="tox">TOX</option>
                </select>

                <input
                  className={`col-span-2 rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                    errors.contact_value
                      ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                      : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                  }`}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={
                    contactType === "telegram"
                      ? "@username"
                      : contactType === "jabber"
                      ? "user@server"
                      : contactType === "tox"
                      ? "TOX ID"
                      : "—"
                  }
                  disabled={contactType === "none"}
                  aria-invalid={Boolean(errors.contact_value)}
                  aria-describedby={errors.contact_value ? "contact-error" : undefined}
                />
              </div>
              {errors.contact_value && (
                <p id="contact-error" className="mt-1 text-sm text-red-400">{errors.contact_value}</p>
              )}
            </div>
          )}

          {/* 6) Инвайт-код — только регистрация */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-zinc-400">Инвайт-код</label>
              <input
                className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 ${
                  errors.invite_code
                    ? "border-red-500 bg-zinc-950 focus:ring-red-600"
                    : "border-zinc-800 bg-zinc-950 focus:ring-zinc-600"
                }`}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="например: VIP200 (необязательно)"
                aria-invalid={Boolean(errors.invite_code)}
                aria-describedby={errors.invite_code ? "invite-error" : undefined}
              />
              {errors.invite_code && (
                <p id="invite-error" className="mt-1 text-sm text-red-400">{errors.invite_code}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-200 px-4 py-2.5 font-medium text-zinc-900 shadow hover:bg-zinc-300 disabled:opacity-60"
          >
            {loading
              ? mode === "login"
                ? "Входим…"
                : "Регистрируем…"
              : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
          </button>

          {/* Ссылка на сброс пароля */}
          <div className="text-center text-sm">
            <Link href="/reset" className="text-zinc-300 hover:text-white">
              Забыли пароль?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
