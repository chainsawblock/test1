import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur shadow-sm " +
        "dark:bg-zinc-900/60 dark:border-zinc-800 " + className
      }
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={"p-6 pb-2 " + className} {...props} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={"text-xl font-semibold " + className} {...props} />;
}

export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={"p-6 pt-2 " + className} {...props} />;
}
