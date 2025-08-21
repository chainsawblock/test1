"use client";

import { Wallet, Gift } from "lucide-react";

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BalanceCard({
  bonusUsdCents,
  inviteCode,
}: {
  bonusUsdCents: number;
  inviteCode: string | null;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">Баланс</h2>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Wallet size={18} />
          <span className="text-sm">Бонус</span>
        </div>
        <div className="text-sm text-zinc-100">
          {formatUsd(bonusUsdCents)}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Gift size={18} />
          <span className="text-sm">Инвайт-код</span>
        </div>
        <div className="truncate text-sm text-zinc-100">
          {inviteCode ?? "—"}
        </div>
      </div>

      {/* Этап 2: здесь появится поле для применения инвайта */}
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-300"
        title="Скоро"
      >
        Применить инвайт (скоро)
      </button>
    </div>
  );
}
