"use client";

import { useMemo } from "react";
import zxcvbn from "zxcvbn";

type Props = {
  password: string;
  userInputs?: string[];
};

const labels = ["Очень слабый", "Слабый", "Средний", "Хороший", "Сильный"];
const reqs = [
  { id: "len",     label: "Минимум 8 символов", test: (p: string) => p.length >= 8 },
  { id: "lower",   label: "Строчная буква",     test: (p: string) => /[a-z]/.test(p) },
  { id: "upper",   label: "Заглавная буква",    test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit",   label: "Цифра",              test: (p: string) => /\d/.test(p) },
  { id: "symbol",  label: "Спецсимвол",         test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password, userInputs = [] }: Props) {
  const { score, feedback, passed } = useMemo(() => {
    const res = zxcvbn(password, userInputs);
    const passed = reqs.map(r => ({ id: r.id, ok: r.test(password), label: r.label }));
    return { score: res.score, feedback: res.feedback, passed };
  }, [password, userInputs]);

  const bars = 5;
  const active = Math.min(bars, Math.max(1, (password ? 1 : 0) + (password ? 0 : 0) + (scoreToBars(score))));
  function scoreToBars(s: number) { return s + 1; }
  const color =
    (score: number) =>
      score <= 1 ? "bg-red-500" : score === 2 ? "bg-orange-500" : score === 3 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1" aria-label="Индикатор сложности пароля">
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded ${i < scoreToBars(score) ? color(score) : "bg-zinc-800"}`} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{labels[score]}</span>
        {feedback.warning && <span className="text-xs text-zinc-500">{feedback.warning}</span>}
      </div>

      <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {passed.map(p => (
          <li key={p.id} className="flex items-center gap-2">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
              p.ok ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-400"
            }`} aria-hidden>
              {p.ok ? "✓" : "•"}
            </span>
            <span className={p.ok ? "text-zinc-300" : "text-zinc-500"}>{p.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
