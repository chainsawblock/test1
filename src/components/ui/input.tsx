import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={
        "w-full rounded-xl border border-zinc-300/80 bg-white px-4 py-2.5 " +
        "outline-none ring-offset-0 focus:ring-2 focus:ring-blue-500/40 " +
        "dark:bg-zinc-900 dark:border-zinc-800 " + className
      }
      {...props}
    />
  );
});
