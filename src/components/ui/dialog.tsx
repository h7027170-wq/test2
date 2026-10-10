"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton, Button, type ButtonVariant } from "./button";
import { Field, Textarea } from "./form";
import { useI18n } from "@/components/providers/i18n";

/** Native <dialog>: focus is trapped, Esc closes, focus returns to the trigger. */
export function Dialog({ open, onClose, title, children, footer, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useI18n();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn("m-auto w-[min(560px,calc(100vw-32px))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg", className)}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-2xl">
              {title}
            </h2>
            <IconButton icon="x" label={t("common.close")} onClick={onClose} className="-me-2 -mt-1" />
          </div>
          {children}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  variant = "primary",
  reasonLabel,
  reasonError,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  variant?: ButtonVariant;
  reasonLabel?: string;
  reasonError?: string;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  async function submit() {
    if (reasonLabel && !reason.trim()) {
      setError(reasonError ?? t("common.required"));
      return;
    }
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button variant={variant} onClick={submit} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body && <div className="text-ink-2">{body}</div>}
      {reasonLabel && (
        <Field label={reasonLabel} error={error} className="mt-4">
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} aria-describedby={describedBy} invalid={invalid} className="min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
          )}
        </Field>
      )}
    </Dialog>
  );
}
