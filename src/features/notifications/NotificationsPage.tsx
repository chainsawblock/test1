// src/features/notifications/NotificationsPage.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client"; // если нет алиаса "@", замени на относительный путь

type Priority = "low" | "normal" | "high";
type Kind = "system" | "message" | "comment" | "billing" | "security";

type Row = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: Kind;
  data: Record<string, unknown>;
  priority: Priority;
  seen_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

type Filter = "all" | "unread" | "read";

const PAGE_SIZE = 20;

function since(ts: string) {
  const d = new Date(ts).getTime();
  const diff = Math.max(0, Date.now() - d) / 1000;
  if (diff < 60) return `${Math.floor(diff)} сек`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return `${Math.floor(diff / 86400)} дн`;
}

export default function NotificationsPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [end, setEnd] = useState(false);
  const router = useRouter();

  // ✅ фикc типизации: sentinelRef указывает на <li/>, значит HTMLLIElement
  const sentinelRef = useRef<HTMLLIElement>(null);

  // auth + первичная загрузка
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // загрузка списка по фильтру
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      const q = supabase.from("notifications").select("*").eq("user_id", userId);

      if (filter === "unread") q.is("read_at", null);
      if (filter === "read") q.not("read_at", "is", null);

      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        console.error(error);
        setItems([]);
        setEnd(true);
        setLoading(false);
        return;
      }
      if (cancelled) return;

      setItems((data ?? []) as Row[]);
      setEnd((data?.length ?? 0) < PAGE_SIZE);
      setLoading(false);

      // seen_at при первом показе страницы
      const unseen = (data ?? []).filter((n) => !n.seen_at).map((n) => n.id);
      if (unseen.length) {
        await supabase.from("notifications").update({ seen_at: new Date().toISOString() }).in("id", unseen);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, filter, supabase]);

  // infinite scroll
  useEffect(() => {
    if (end || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loadingMore) return;
        setLoadingMore(true);

        const offset = items.length;
        const q = supabase.from("notifications").select("*").eq("user_id", userId as string);

        if (filter === "unread") q.is("read_at", null);
        if (filter === "read") q.not("read_at", "is", null);

        const { data, error } = await q
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) console.error(error);
        const next = (data ?? []) as Row[];
        setItems((prev) => [...prev, ...next]);
        setEnd(next.length < PAGE_SIZE);
        setLoadingMore(false);
      },
      { rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [end, loading, loadingMore, items.length, supabase, userId, filter]);

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
    if (!error) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    }
  }

  async function markAsUnread(id: string) {
    const { error } = await supabase.from("notifications").update({ read_at: null }).eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: null } : n)));
    }
  }

  async function markAllAsRead() {
    if (!userId) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    if (!error) {
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    }
  }

  if (userId === null && !loading) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="card-dark rounded-xl p-6">
          <div className="text-sm opacity-70">Войдите, чтобы посмотреть уведомления.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="card-dark rounded-xl overflow-hidden">
        {/* toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]/70">
          <div className="flex gap-1">
            {(["all", "unread", "read"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx("px-3 py-1.5 text-sm rounded-md", f === filter ? "bg-white/5" : "hover:bg-white/5")}
              >
                {f === "all" ? "Все" : f === "unread" ? "Непрочитанные" : "Прочитанные"}
              </button>
            ))}
          </div>
          <button onClick={markAllAsRead} className="text-sm opacity-80 hover:opacity-100">
            Пометить всё прочитанным
          </button>
        </div>

        {/* list */}
        {loading ? (
          <div className="p-6 text-sm opacity-70">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm opacity-70">Пока пусто</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {items.map((n) => (
              <li key={n.id} className={clsx("px-4 py-3", !n.read_at && "bg-white/[0.02]")}>
                <div className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "mt-1 h-2 w-2 rounded-full flex-none",
                      n.read_at ? "bg-[var(--border)]" : n.priority === "high" ? "bg-rose-500" : "bg-emerald-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-[11px] opacity-60">· {since(n.created_at)} назад</div>
                    </div>
                    {n.body && <div className="text-sm opacity-80 mt-0.5">{n.body}</div>}
                    {n.link && (
                      <button
                        className="text-xs mt-2 opacity-90 hover:opacity-100 underline"
                        onClick={async () => {
                          await markAsRead(n.id);
                          if (n.link) router.push(n.link);
                        }}
                      >
                        Открыть
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {n.read_at ? (
                      <button className="text-xs opacity-80 hover:opacity-100" onClick={() => markAsUnread(n.id)}>
                        Сделать непрочитанным
                      </button>
                    ) : (
                      <button className="text-xs opacity-80 hover:opacity-100" onClick={() => markAsRead(n.id)}>
                        Прочитано
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {/* sentinel for infinite scroll */}
            <li ref={sentinelRef} />
          </ul>
        )}
      </div>
    </div>
  );
}
