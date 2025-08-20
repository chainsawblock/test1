import * as React from "react";

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={"block text-sm text-zinc-600 dark:text-zinc-300 " + className} {...props} />;
}
