"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) setEmail(data.user?.email ?? null);
    });
    return () => { ignore = true; };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6 shadow-sm backdrop-blur">
        <h1 className="mb-3 text-2xl font-semibold text-zinc-100">Профиль</h1>
        <p className="text-zinc-300">Вы вошли как <b className="text-zinc-100">{email}</b></p>
        <button
          onClick={signOut}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-medium text-zinc-200 hover:bg-zinc-900"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
