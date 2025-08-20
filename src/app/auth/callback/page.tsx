import { Suspense } from "react";
import AuthCallbackClient from "./Client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-400">Обработка ссылки…</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
