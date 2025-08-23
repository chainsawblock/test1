"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import clsx from "clsx";

export type ToastKind = "info" | "success" | "warning" | "error";
export type Toast = {
  id?: string;
  title: string;
  body?: string;
  kind?: ToastKind;
  // действия (опционально)
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  // авто-закрытие (мс)
  duration?: number;
};

type Ctx = { show: (t: Toast) => string; dismiss: (id: string) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider is missing");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<Required<Toast>>>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((t: Toast) => {
    const id = t.id ?? crypto.randomUUID();
    const full: Required<Toast> = {
      id,
      title: t.title,
      body: t.body ?? "",
      kind: t.kind ?? "info",
      actionLabel: t.actionLabel ?? "",
      onAction: t.onAction ?? (async () => {}),
      duration: t.duration ?? 6000,
    };
    setToasts((prev) => {
      const next = [full, ...prev].slice(0, 4); // максимум 4 тоста
      return next;
    });
    // авто-закрытие
    if (full.duration > 0) {
      setTimeout(() => dismiss(id), full.duration);
    }
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* контейнер тостов */}
      <div
        className="fixed z-[60] right-4 bottom-4 flex flex-col gap-2 w-[min(92vw,380px)]"
        aria-live="assertive" role="region" aria-label="Уведомления"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={clsx(
              "rounded-xl border px-3 py-2 shadow-lg",
              "bg-[var(--surface-1)] text-[var(--text)] border-[var(--border)]/80"
            )}
          >
            <div className="flex items-start gap-3">
              <span className={clsx(
                "mt-1 h-2 w-2 rounded-full flex-none",
                t.kind === "success" ? "bg-emerald-500"
                : t.kind === "warning" ? "bg-amber-500"
                : t.kind === "error"   ? "bg-rose-500"
                : "bg-sky-500"
              )}/>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.title}</div>
                {t.body && <div className="text-xs opacity-80 mt-0.5">{t.body}</div>}
                {t.actionLabel && (
                  <button
                    className="text-xs mt-2 underline opacity-90 hover:opacity-100"
                    onClick={async () => {
                      try { await t.onAction(); } finally { dismiss(t.id); }
                    }}
                  >
                    {t.actionLabel}
                  </button>
                )}
              </div>
              <button
                aria-label="Закрыть"
                className="text-xs opacity-70 hover:opacity-100"
                onClick={() => dismiss(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
