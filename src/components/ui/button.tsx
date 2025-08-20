import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: Props) {
  return (
    <button
      className={
        "inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 " +
        "font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
        "disabled:opacity-60 disabled:cursor-not-allowed " + className
      }
      {...props}
    />
  );
}

export function GhostButton({ className = "", ...props }: Props) {
  return (
    <button
      className={
        "inline-flex w-full items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-4 py-2.5 " +
        "font-medium text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 " +
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 " + className
      }
      {...props}
    />
  );
}
