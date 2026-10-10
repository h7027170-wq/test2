"use client";

import { useId, useState, type ComponentProps, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

const control =
  "w-full rounded-md border-[1.5px] border-field bg-surface px-4 text-ink transition-colors placeholder:text-placeholder hover:border-ink-2 focus-visible:border-primary aria-invalid:border-warm disabled:opacity-60";

interface FieldProps {
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  optional?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label, help and error wiring. The error is linked with aria-describedby and announced as text. */
export function Field({ label, help, error, optional, children, className }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [errId, helpId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-medium">
        {label}
        {optional && <span className="ms-2 text-sm font-normal text-mute">({optional})</span>}
      </label>
      {help && (
        <p id={helpId} className="text-sm text-mute">
          {help}
        </p>
      )}
      {children({ id, describedBy, invalid: !!error })}
      {error && (
        <p id={errId} className="flex items-center gap-1.5 text-sm font-medium text-warm-ink">
          <Icon name="alert" className="size-4" />
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(control, "min-h-13", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Textarea({ className, invalid, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea className={cn(control, "min-h-40 py-3 leading-relaxed", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({ className, invalid, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select className={cn(control, "min-h-13 appearance-none bg-no-repeat pe-10", className)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}

export function PasswordInput({ showLabel, hideLabel, invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { showLabel: string; hideLabel: string; invalid?: boolean }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input type={shown ? "text" : "password"} invalid={invalid} className={cn("pe-14", className)} {...props} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? hideLabel : showLabel}
        aria-pressed={shown}
        className="absolute inset-y-0 end-1 my-auto inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
      >
        <Icon name={shown ? "eyeOff" : "eye"} />
      </button>
    </div>
  );
}

export function StrengthMeter({ score, label }: { score: 0 | 1 | 2 | 3 | 4; label: string }) {
  const color = score <= 1 ? "bg-warm" : score === 2 ? "bg-sand-ink" : "bg-primary";
  return (
    <div className="mt-1" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-pill", i <= score ? color : "bg-line")} />
        ))}
      </div>
      {score > 0 && <p className="mt-1 text-sm text-ink-2">{label}</p>}
    </div>
  );
}

export function Checkbox({ label, help, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; help?: ReactNode }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={id} type="checkbox" className="mt-1 size-6 shrink-0 cursor-pointer accent-primary" {...props} />
      <label htmlFor={id} className="cursor-pointer">
        {label}
        {help && <span className="block text-sm text-mute">{help}</span>}
      </label>
    </div>
  );
}

/** Large selectable card used for radios and multi-select checkboxes. */
export function ChoiceCard({
  type,
  name,
  checked,
  onChange,
  title,
  description,
  icon,
  accent,
  className,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName | ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-14 cursor-pointer items-start gap-3 rounded-md border-[1.5px] bg-surface p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus",
        checked ? "border-primary bg-primary-soft" : "border-field/70 hover:border-ink-2",
        className,
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {icon && (typeof icon === "string" ? <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", accent ?? "bg-surface-2")}><Icon name={icon as IconName} /></span> : icon)}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-2">{description}</span>}
      </span>
      <span className={cn("mt-0.5 inline-flex size-6 shrink-0 items-center justify-center border-[1.5px]", type === "radio" ? "rounded-full" : "rounded-sm", checked ? "border-primary bg-primary text-primary-fg" : "border-field")}>
        {checked && <Icon name="check" className="size-4" />}
      </span>
    </label>
  );
}

export function Chip({ selected, children, className, ...props }: { selected?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] px-4 text-sm font-medium transition-colors",
        selected ? "border-primary bg-primary-soft text-primary-ink" : "border-field/70 bg-surface text-ink-2 hover:border-ink-2 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ErrorSummary({ title, errors }: { title: string; errors: { id?: string; message: string }[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" tabIndex={-1} className="rounded-md border-[1.5px] border-warm bg-warm-soft p-4 text-warm-ink">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-disc ps-5">
        {errors.map((e) => (
          <li key={e.message}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}
