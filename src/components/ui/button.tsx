import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

const variants = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "border-[1.5px] border-field bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink underline decoration-1 underline-offset-4 hover:decoration-2 px-2!",
  soft: "bg-primary-soft text-primary-ink hover:brightness-[0.97] dark:hover:brightness-110",
  crisis: "border-[1.5px] border-warm text-warm-ink bg-transparent hover:bg-warm-soft",
  danger: "bg-warm text-warm-fg hover:brightness-95",
} as const;

const sizes = {
  sm: "min-h-11 px-4 text-sm gap-1.5",
  md: "min-h-13 px-6 text-base gap-2",
  lg: "min-h-15 px-8 text-lg gap-2.5",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconEnd?: IconName;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-pill font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:opacity-55",
    variants[variant],
    sizes[size],
    className,
  );
}

function Inner({ icon, iconEnd, loading, children }: Pick<Common, "icon" | "iconEnd" | "loading" | "children">) {
  return (
    <>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden /> : icon && <Icon name={icon} />}
      <span>{children}</span>
      {iconEnd && <Icon name={iconEnd} />}
    </>
  );
}

export function Button({ variant, size, icon, iconEnd, loading, className, children, disabled, ...props }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      <Inner icon={icon} iconEnd={iconEnd} loading={loading}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({ variant, size, icon, iconEnd, className, children, ...props }: Omit<Common, "loading"> & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      <Inner icon={icon} iconEnd={iconEnd}>
        {children}
      </Inner>
    </Link>
  );
}

export function IconButton({ icon, label, className, active, ...props }: { icon: IconName; label: string; active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink",
        active && "bg-primary-soft text-primary-ink",
        className,
      )}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
