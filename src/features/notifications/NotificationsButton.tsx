"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "./useNotifications";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export function NotificationsButton() {
  const { items, unread, loading, since, markAsRead, markAllAsRead } = useNotifications(20);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Уведомления"
        title="Уведомления"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "group p-2 h-9 w-9 inline-flex items-center justify-center",
          "bg-transparent rounded-none border-0 shadow-none",
          "hover:bg-transparent active:bg-transparent",
          "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
          "transition-colors duration-150"
        )}
      >
        <Bell size={18} className="text-[var(--header-fg)] group-hover:text-white/90" />
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
          className="absolute right-0 mt-2 w-[22rem] max-h-[60vh] overflow-auto
                     border border-[var(--border)]/80 rounded-xl shadow-xl
                     bg-[var(--surface-1)] text-[var(--text)]"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]/60">
            {/* кликабельный заголовок → страница всех уведомлений */}
            <Link
              href="/notifications"
              className="text-sm opacity-90 hover:opacity-100 hover:underline focus:outline-none focus-visible:underline"
              onClick={() => setOpen(false)}
            >
              Уведомления
            </Link>

            <button
              onClick={markAllAsRead}
              className="text-xs opacity-80 hover:opacity-100"
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
              {items.map((n) => (
                <li
                  key={n.id}
                  className={clsx(
                    "px-3 py-2 cursor-pointer",
                    "hover:bg-white/5",
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
                        "mt-1 h-2 w-2 rounded-full",
                        n.read_at ? "bg-[var(--border)]" :
                        n.priority === "high" ? "bg-rose-500" :
                        "bg-emerald-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      {n.body && (
                        <div className="text-xs opacity-75 truncate">{n.body}</div>
                      )}
                      <div className="text-[11px] opacity-60 mt-0.5">{since(n.created_at)} ago</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
