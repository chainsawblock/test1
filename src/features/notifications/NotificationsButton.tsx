// src/features/notifications/NotificationsButton.tsx
"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "./useNotifications";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { getSupabaseClient } from "@/lib/supabase/client"; // при отсутствии алиаса — замени на относительный путь

function NotificationsButton() {
  const { items, unread, loading, since, markAsRead, markAllAsRead } = useNotifications(20);
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef<number>(-1);

  const router = useRouter();

  // лениво инициализируем supabase (только в браузере)
  const supabaseRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null);
  useEffect(() => {
    try { supabaseRef.current = getSupabaseClient(); } catch {}
  }, []);

  // закрытие по клику вне
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        activeIndexRef.current = -1;
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // отметить видимые как seen_at при открытии (фикс TS: сохраняем current в sb)
  useEffect(() => {
    if (!open) return;
    const sb = supabaseRef.current;
    if (!sb) return;

    const unseenIds = items.filter((n) => !n.seen_at).map((n) => n.id);
    (async () => {
      if (unseenIds.length) {
        try {
          await sb
            .from("notifications")
            .update({ seen_at: new Date().toISOString() })
            .in("id", unseenIds);
        } catch {}
      }
    })();
  }, [open, items]);

  // вспомогательные: фокус на элемент меню (по индексу)
  function getMenuItems(): HTMLElement[] {
    const el = menuRef.current;
    if (!el) return [];
    return Array.from(el.querySelectorAll<HTMLElement>("[data-menu-item]"));
  }
  function focusIndex(next: number) {
    const els = getMenuItems();
    if (els.length === 0) return;
    const clamped = ((next % els.length) + els.length) % els.length;
    activeIndexRef.current = clamped;
    els[clamped].focus();
  }

  // обработчик клавиш на кнопке
  function onButtonKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) setOpen(true);
      requestAnimationFrame(() => focusIndex(0));
    }
  }

  // обработчик клавиш внутри меню
  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      activeIndexRef.current = -1;
      buttonRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); focusIndex(activeIndexRef.current + 1); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); focusIndex(activeIndexRef.current - 1); return; }
    if (e.key === "Home")      { e.preventDefault(); focusIndex(0); return; }
    if (e.key === "End")       { e.preventDefault(); focusIndex(getMenuItems().length - 1); return; }
  }

  // клик по шапке — закрыть и перейти
  function goAll() { setOpen(false); }

  // при клике по кнопке — открыть и сфокусировать первый пункт
  function onButtonClick() {
    const next = !open;
    setOpen(next);
    if (next) requestAnimationFrame(() => focusIndex(0));
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        aria-label="Уведомления"
        title="Уведомления"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notif-menu"
        onKeyDown={onButtonKeyDown}
        onClick={onButtonClick}
        className={clsx(
          "p-2 h-9 w-9 inline-flex items-center justify-center",
          "bg-transparent rounded-none border-0 shadow-none",
          "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
          "transition-colors duration-150",
          "text-[#9e9e9e] hover:text-white/90 active:text-white"
        )}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white
                       bg-rose-500 rounded-full text-center"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          id="notif-menu"
          role="menu"
          aria-label="Уведомления"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-2 w-[22rem] max-h-[60vh] overflow-auto
                     border border-[var(--border)]/80 rounded-xl shadow-xl
                     bg-[var(--surface-1)] text-[var(--text)]"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]/60">
            <Link
              href="/notifications"
              className="text-sm opacity-90 hover:opacity-100 hover:underline focus:outline-none focus-visible:underline"
              onClick={goAll}
              data-menu-item
              role="menuitem"
              tabIndex={0}
            >
              Уведомления
            </Link>

            <button
              onClick={markAllAsRead}
              className="text-xs opacity-80 hover:opacity-100"
              data-menu-item
              role="menuitem"
              tabIndex={0}
            >
              Пометить всё прочитанным
            </button>
          </div>

          {loading ? (
            <div className="p-4 text-sm opacity-70">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm opacity-70">Пока пусто</div>
          ) : (
            <ul className="py-1">
              {items.map((n, idx) => (
                <li key={n.id}>
                  <button
                    data-menu-item
                    role="menuitem"
                    tabIndex={idx === 0 ? 0 : -1}
                    className={clsx(
                      "w-full text-left px-3 py-2 cursor-pointer",
                      "hover:bg-white/5 focus:bg-white/5",
                      !n.read_at && "bg-white/[0.02]"
                    )}
                    onClick={async () => {
                      await markAsRead(n.id);
                      if (n.link) {
                        setOpen(false);
                        router.push(n.link);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={clsx(
                          "mt-1 h-2 w-2 rounded-full flex-none",
                          n.read_at
                            ? "bg-[var(--border)]"
                            : n.priority === "high"
                            ? "bg-rose-500"
                            : "bg-emerald-500"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {n.body && <div className="text-xs opacity-75 truncate">{n.body}</div>}
                        <div className="text-[11px] opacity-60 mt-0.5">{since(n.created_at)} ago</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Экспорт и как default, и как именованный — чтобы любой импорт работал
export { NotificationsButton };
export default NotificationsButton;
