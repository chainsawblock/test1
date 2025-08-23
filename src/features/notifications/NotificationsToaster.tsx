"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/features/notifications/toast/ToastProvider";
import { getSupabaseClient } from "@/lib/supabase/client";

type Row = {
  id: string; user_id: string; title: string; body: string | null; link: string | null;
  priority: "low" | "normal" | "high"; created_at: string; read_at: string | null;
};

export default function NotificationsToaster({ onlyHigh = true }: { onlyHigh?: boolean }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { show } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted.current) return;
      setUserId(user?.id ?? null);
    })();
    return () => { mounted.current = false; };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications_toast_${userId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        async (payload) => {
          const n = payload.new as Row;
          if (onlyHigh && n.priority !== "high") return;

          show({
            title: n.title,
            body: n.body ?? "",
            kind: n.priority === "high" ? "warning" : "info",
            actionLabel: n.link ? "Открыть" : "Прочитано",
            onAction: async () => {
              // пометить прочитанным
              await supabase.from("notifications")
                .update({ read_at: new Date().toISOString() })
                .eq("id", n.id).is("read_at", null);
              if (n.link) router.push(n.link);
            },
            duration: 7000
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, show, router, onlyHigh]);

  return null; // компонент-«невидимка»
}
