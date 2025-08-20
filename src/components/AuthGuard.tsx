'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../lib/supabase/client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;
    const supabase = getSupabaseClient();

    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (!ignore && !data.session?.user) router.replace('/auth');
      setChecking(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) router.replace('/auth');
    });

    run();
    return () => {
      ignore = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-10 text-center">
          <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          <p className="text-zinc-400">Проверка авторизации…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
