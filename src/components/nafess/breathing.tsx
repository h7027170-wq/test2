"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/providers/i18n";
import { Button } from "@/components/ui/button";

const TOTAL = 60;
const CYCLE = 8; // matches --breath-cycle and the `breathe` keyframes (in 40%, hold 15%, out 45%)

function phaseAt(elapsed: number): "in" | "hold" | "out" {
  const p = (elapsed % CYCLE) / CYCLE;
  return p < 0.4 ? "in" : p < 0.55 ? "hold" : "out";
}

/** Guided breathing minute. Works without animation: the words carry the rhythm. */
export function BreathingMinute({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with a media query
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!running) return;
    const start = Date.now() - elapsed * 1000;
    const id = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      if (e >= TOTAL) {
        setRunning(false);
        setElapsed(0);
        setDone(true);
      } else setElapsed(e);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- elapsed is read once when starting
  }, [running]);

  const phase = phaseAt(elapsed);
  const size = compact ? "size-36" : "size-56";

  return (
    <section aria-label={t("breath.title")} className={cn("flex flex-col items-center gap-4 rounded-lg bg-primary-soft p-6 text-center text-primary-ink", !compact && "sm:p-10")}>
      <p className="font-display text-xl font-semibold">{t("breath.title")}</p>
      <div className={cn("relative flex items-center justify-center", size)}>
        <span className={cn("absolute inset-0 rounded-full bg-primary/20", running && !reduced && "animate-breathe")} style={{ transform: running ? undefined : "scale(0.72)" }} aria-hidden />
        <span className={cn("absolute inset-6 rounded-full bg-primary/25", running && !reduced && "animate-breathe")} style={{ transform: running ? undefined : "scale(0.72)" }} aria-hidden />
        <span className="relative text-xl font-semibold" aria-live="polite">
          {running ? t(`breath.${phase}`) : done ? "" : ""}
        </span>
      </div>
      {running && <p className="text-sm">{t("breath.remaining", { n: Math.ceil(TOTAL - elapsed) })}</p>}
      {done && !running && <p role="status">{t("breath.done")}</p>}
      {reduced && <p className="text-sm">{t("breath.reducedMotion")}</p>}
      <Button
        variant={running ? "secondary" : "primary"}
        icon={running ? undefined : "wind"}
        onClick={() => {
          setDone(false);
          if (running) {
            setRunning(false);
            setElapsed(0);
          } else setRunning(true);
        }}
      >
        {running ? t("breath.stop") : t("breath.start")}
      </Button>
    </section>
  );
}
