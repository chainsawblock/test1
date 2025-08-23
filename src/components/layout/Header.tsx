// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User, Settings } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Главная" },
  { href: "/dashboard", label: "Панель" },
  { href: "/pricing", label: "Цены" },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={clsx(
        "px-3 py-2 text-sm",
        "text-[var(--header-muted)] hover:text-[var(--header-fg)]",
        active && "text-[var(--header-fg)]"
      )}
    >
      {children}
    </Link>
  );
}

function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        // кликабельная зона есть, но визуально «голая» и без подсветок
        "p-2 h-9 w-9 inline-flex items-center justify-center",
        "bg-transparent rounded-none border-0 shadow-none",
        "hover:bg-transparent active:bg-transparent",
        "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
        "transition-none"
      )}
    >
      {/* иконка без hover-изменений */}
      <span className="inline-flex">
        {children}
      </span>
    </button>
  );
}

export default function Header() {
  return (
    <header
      className={clsx(
        "sticky top-0 z-50",
        "bg-[var(--header-bg)] text-[var(--header-fg)]",
        "border-b",
        "border-[var(--header-border)]/80",
        "backdrop-blur supports-[backdrop-filter]:bg-[color:var(--header-bg)]/95"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Логотип/бренд */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-base font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
              FullProof
            </div>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Правые иконки — без боксов и подсветки */}
          <div className="flex items-center gap-1">
            <IconButton label="Уведомления">
              <Bell size={18} style={{ color: "var(--header-fg)" }} />
            </IconButton>
            <IconButton label="Настройки">
              <Settings size={18} style={{ color: "var(--header-fg)" }} />
            </IconButton>
            <IconButton label="Профиль">
              <User size={18} style={{ color: "var(--header-fg)" }} />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  );
}
