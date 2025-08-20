import { Suspense } from "react";
import AuthCallbackClient from "./Client";

// Страница должна рендериться динамически (не как SSG)
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-400">Обработка ссылки…</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
