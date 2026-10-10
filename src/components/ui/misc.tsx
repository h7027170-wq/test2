import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Avatar as AvatarT, AvatarShape, Tint } from "@/types/domain";

export const tintClass: Record<Tint, string> = {
  sky: "bg-sky-soft text-sky-ink",
  sage: "bg-sage-soft text-sage-ink",
  lilac: "bg-lilac-soft text-lilac-ink",
  sand: "bg-sand-soft text-sand-ink",
};

export function Badge({ tint, tone, children, className }: { tint?: Tint; tone?: "primary" | "warm" | "neutral"; children: ReactNode; className?: string }) {
  const toneClass = tone === "warm" ? "bg-warm-soft text-warm-ink" : tone === "primary" ? "bg-primary-soft text-primary-ink" : tone === "neutral" ? "bg-surface-2 text-ink-2" : "";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-3 py-0.5 text-sm font-medium whitespace-nowrap", tint ? tintClass[tint] : toneClass, className)}>
      {children}
    </span>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

const shapePaths: Record<AvatarShape, string> = {
  leaf: "M10 30C10 18 18 10 30 10c0 12-8 20-20 20zM10 30l12-12",
  moon: "M28 24A10 10 0 1 1 16 12a8 8 0 0 0 12 12z",
  wave: "M8 22c4-6 8-6 12 0s8 6 12 0M8 16c4-6 8-6 12 0s8 6 12 0",
  sun: "M20 26a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM20 8v3M20 29v3M8 20h3M29 20h3M11.5 11.5l2 2M26.5 26.5l2 2M11.5 28.5l2-2M26.5 13.5l2-2",
  cloud: "M13 27h15a5 5 0 0 0 0-10 7 7 0 0 0-13.5 2A4 4 0 0 0 13 27z",
  star: "M20 9l3.2 7 7.3.8-5.5 5 1.6 7.2L20 25.3 13.4 29l1.6-7.2-5.5-5 7.3-.8z",
  drop: "M20 9s8 8.5 8 14a8 8 0 0 1-16 0c0-5.5 8-14 8-14z",
  hill: "M6 29l9-12 6 7 4-5 9 10z",
};

export const avatarShapes = Object.keys(shapePaths) as AvatarShape[];

export function Avatar({ avatar, size = 40, className }: { avatar: AvatarT; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full", tintClass[avatar.tint], className)} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 40 40" width={size * 0.8} height={size * 0.8} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d={shapePaths[avatar.shape]} />
      </svg>
    </span>
  );
}

export function LiveDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-sage-ink">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage-ink opacity-50 motion-reduce:hidden" />
        <span className="relative inline-flex size-2.5 rounded-full bg-sage-ink" />
      </span>
      {label}
    </span>
  );
}

export function Steps({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === current ? "step" : undefined}>
            <span className={cn("block h-1.5 rounded-pill", i <= current ? "bg-primary" : "bg-line")} />
            <span className={cn("mt-2 block text-sm", i === current ? "font-semibold text-ink" : "text-mute")}>{s}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({ title, lead, action, id, as: H = "h2" }: { title: string; lead?: string; action?: ReactNode; id?: string; as?: "h1" | "h2" }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-reading">
        <H id={id} className={H === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}>
          {title}
        </H>
        {lead && <p className="mt-3 text-lg text-ink-2">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
