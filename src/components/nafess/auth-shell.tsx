import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AuthShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative overflow-clip">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-32 mx-auto size-[560px] max-w-none rounded-full bg-primary-soft opacity-60 blur-3xl" />
      <div className="container-page relative py-10 sm:py-16">
        <div className={cn("mx-auto rounded-xl border border-line bg-surface p-6 shadow-md sm:p-10", wide ? "max-w-3xl" : "max-w-xl")}>{children}</div>
      </div>
    </div>
  );
}
