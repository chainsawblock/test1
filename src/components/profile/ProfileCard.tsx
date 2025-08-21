"use client";

import { Mail, User, Calendar, AtSign } from "lucide-react";

type Props = {
  email: string;
  username: string;
  contactType: "telegram" | "jabber" | "tox" | null;
  contactValue: string;
  createdAt: string;
  inviteCode: string | null;
};

export default function ProfileCard({
  email,
  username,
  contactType,
  contactValue,
  createdAt,
  inviteCode,
}: Props) {
  const contactLabel =
    contactType === "telegram"
      ? "Telegram"
      : contactType === "jabber"
      ? "Jabber"
      : contactType === "tox"
      ? "TOX"
      : "Контакт";

  const created = new Date(createdAt).toLocaleDateString();

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">Профиль</h2>

      <Row icon={<Mail size={18} />} label="Email" value={email} />
      <Row icon={<User size={18} />} label="Логин" value={username || "-"} />
      <Row
        icon={<AtSign size={18} />}
        label={contactLabel}
        value={contactValue || "-"}
      />
      <Row
        icon={<Calendar size={18} />}
        label="Дата регистрации"
        value={created}
      />
      <Row
        icon={<AtSign size={18} />}
        label="Инвайт-код"
        value={inviteCode ?? "—"}
      />
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-zinc-400">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="truncate text-sm text-zinc-200">{value}</div>
    </div>
  );
}
