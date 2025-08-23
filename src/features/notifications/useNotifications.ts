"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client"; // ← путь из features → lib
// Если у тебя alias "@": import { getSupabaseClient } from "@/lib/supabase/client";

export type NotificationPriority = "low" | "normal" | "high";
export type NotificationType = "system" | "message" | "comment" | "billing" | "security";

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: NotificationType;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  seen_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

function since(ts: string) {
  const d = new Date(ts).getTime();
  const diff = Math.max(0, Date.now() - d) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

export function useNotifications(limit = 20) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  // первичная авторизация и загрузка
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted.current) return;
        setUserId(user?.id ?? null);
        if (!user) { setItems([]); setUnread(0); setLoading(false); return; }

        // список
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        if (!mounted.current) return;
        setItems((data ?? []) as NotificationRow[]);

        // счётчик
        const { count, error: cErr } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null);
        if (cErr) throw cErr;
        if (!mounted.current) return;
        setUnread(count ?? 0);
      } catch (e) {
        if (process.env.NODE_ENV !== "production") console.error(e);
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime подписка
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notifications_user_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as NotificationRow;
          setItems((prev) => [n, ...prev].slice(0, limit));
          setUnread((c) => c + 1);
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV !== "production") console.log("Realtime status:", status);
      });

    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]);

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
    if (!error) {
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread((c) => Math.max(0, c - 1));
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
      setItems((prev) => prev.map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
      setUnread(0);
    }
  }

  return { userId, items, unread, loading, since, markAsRead, markAllAsRead };
}
