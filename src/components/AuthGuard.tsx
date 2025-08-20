"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const isAuthed = !!data.session?.user;
      if (!ignore) {
        if (!isAuthed) router.replace("/auth");
        setChecking(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace("/auth");
    });

    run();
    return () => {
      ignore = true;
      sub?.subscription.unsubscribe();
    };
  }, [router]);

  if (checking) return <div className="text-center">Проверка авторизации…</div>;
  return <>{children}</>;
}
