import { redirect } from "next/navigation";
import { getServerSupabase } from "../lib/supabase/server";
import AuthForm from "../components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await getServerSupabase();         // ⬅️ ждём
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/profile");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-zinc-100">Добро пожаловать</h1>
        <p className="mt-2 text-zinc-400">Войдите или зарегистрируйтесь, чтобы продолжить</p>
      </div>
      <AuthForm />
    </div>
  );
}
