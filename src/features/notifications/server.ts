"use server";
import { getAdminClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { CreateNotificationInput } from "./schema";

export async function createNotification(input: CreateNotificationInput) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: input.user_id,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      type: input.type ?? "system",
      data: input.data ?? {},
      priority: input.priority ?? "normal",
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/notifications");
  return data!.id as string;
}

export async function markAllAsReadServer(userId: string) {
  const admin = getAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
  revalidatePath("/notifications");
}
