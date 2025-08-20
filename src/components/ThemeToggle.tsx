"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  // считать тему из localStorage/OS
  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const useDark = saved ? saved === "dark" : prefersDark;
    root.classList.toggle("dark", useDark);
    setDark(useDark);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !dark;
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300/70 bg-white/70 px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
      title={dark ? "Светлая тема" : "Тёмная тема"}
    >
      {dark ? <Sun size={16}/> : <Moon size={16}/>}
      <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
