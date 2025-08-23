"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { NotificationRow } from "./schema";

export async function listNotifications(opts?: { limit?: number; offset?: number }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range(opts?.offset ?? 0, (opts?.offset ?? 0) + (opts?.limit ?? 20) - 1);

  if (error) throw error;
  return data as NotificationRow[];
}

export async function unreadCount() {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markAsRead(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) throw error;
}

export async function markAllAsReadClient() {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) throw error;
}
