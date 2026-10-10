"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { HoldReason, Mood, StoryKind } from "@/types/domain";
import { communities } from "@/data/seed";
import { promptKeys } from "@/data/seed";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip, ErrorSummary, Field, Input, Select, Textarea, Checkbox } from "@/components/ui/form";
import { Notice, LoadingBlock } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { MemberGate, moodTint, PageIntro } from "@/components/nafess/content";
import { tintClass } from "@/components/ui/misc";
import { findPii } from "@/lib/pii";
import { createStory, discardDraft, getDraft, saveDraft } from "@/services/content";
import { cn } from "@/lib/cn";

const moods: Mood[] = ["heavy", "low", "okay", "steady", "light"];
const kinds: StoryKind[] = ["story", "checkin", "win"];

export default function WritePage() {
  return (
    <Suspense fallback={<div className="container-page py-14"><LoadingBlock /></div>}>
      <Writer />
    </Suspense>
  );
}

function Writer() {
  const { t, href, relativeTime } = useI18n();
  const { account, status } = useSession();
  const params = useSearchParams();

  const [communityId, setCommunityId] = useState(params.get("community") ?? "");
  const [kind, setKind] = useState<StoryKind>("story");
  const [mood, setMood] = useState<Mood | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [veilOn, setVeilOn] = useState(false);
  const [veil, setVeil] = useState("");
  const [draftState, setDraftState] = useState<{ status: "idle" | "saving" | "saved"; at?: string }>({ status: "idle" });
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; status: "published" | "held"; holdReasons: HoldReason[] } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const loaded = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Restore a saved draft once.
  useEffect(() => {
    if (!account || loaded.current) return;
    loaded.current = true;
    void getDraft().then((d) => {
      if (!d) return;
      setCommunityId((c) => c || d.communityId);
      setKind(d.kind);
      setMood(d.mood);
      setTitle(d.title);
      setBody(d.body);
      setVeilOn(!!d.veil);
      setVeil(d.veil ?? "");
      setDraftState({ status: "saved", at: d.savedAt });
      setRestored(true);
    });
  }, [account]);

  // Autosave after a short pause in typing.
  useEffect(() => {
    if (!account || !loaded.current || result) return;
    if (!title && !body) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects the pending save
    setDraftState({ status: "saving" });
    const id = setTimeout(async () => {
      const at = await saveDraft({ communityId, kind, mood, title, body, veil: veilOn ? veil : null });
      setDraftState({ status: "saved", at });
    }, 900);
    return () => clearTimeout(id);
  }, [account, communityId, kind, mood, title, body, veilOn, veil, result]);

  const pii = useMemo(() => findPii(`${title}\n${body}`), [title, body]);
  const piiKinds = Array.from(new Set(pii.map((p) => p.kind)));
  const community = communities.find((c) => c.id === communityId);

  if (status === "loading")
    return (
      <div className="container-page py-14">
        <LoadingBlock />
      </div>
    );
  if (!account) return <MemberGate title={t("write.guestTitle")} body={t("write.guestBody")} />;

  if (result) {
    const held = result.status === "held";
    return (
      <div className="container-page py-14">
        <div className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-8 text-center" role="status">
          <span className={cn("mx-auto inline-flex size-16 items-center justify-center rounded-full", held ? "bg-sky-soft text-sky-ink" : "bg-sage-soft text-sage-ink")}>
            <Icon name={held ? "shield" : "check"} className="size-7" />
          </span>
          <h1 className="mt-5 text-3xl">{held ? t("write.heldTitle") : t("write.postedTitle")}</h1>
          <p className="mt-3 text-lg text-ink-2">{held ? t("write.heldBody") : t("write.postedBody")}</p>
          {held && (
            <ul className="mt-4 grid gap-2 text-start">
              {result.holdReasons.map((r) => (
                <li key={r} className="flex items-start gap-2 rounded-md bg-surface-2 p-3 text-ink-2">
                  <Icon name="info" className="mt-1" />
                  {t(`write.heldReasons.${r}`)}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href={href(`/stories/${result.id}`)}>{t("write.viewStory")}</ButtonLink>
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setTitle("");
                setBody("");
                setMood(null);
                setVeil("");
                setVeilOn(false);
                setDraftState({ status: "idle" });
              }}
            >
              {t("write.writeAnother")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!communityId) e.community = t("write.errors.community");
    if (!mood) e.mood = t("write.errors.mood");
    if (!title.trim()) e.title = t("write.errors.title");
    if (body.trim().length < 20) e.body = t("write.errors.body");
    return e;
  }

  async function publish(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => summaryRef.current?.querySelector<HTMLElement>("[role=alert]")?.focus());
      return;
    }
    setBusy(true);
    const res = await createStory({ communityId, kind, mood: mood!, title, body, veil: veilOn ? veil : null });
    setBusy(false);
    if (res.ok) setResult(res);
    else if (res.error === "rate-limited") setErrors({ rate: t("write.errors.rate") });
  }

  const draftLabel =
    draftState.status === "saving" ? t("write.draftSaving") : draftState.status === "saved" && draftState.at ? t("write.draftSaved", { time: relativeTime(draftState.at) }) : t("write.draftNone");

  return (
    <>
      <PageIntro title={t("write.title")} lead={t("write.lead")} />
      <form onSubmit={publish} noValidate className="container-page grid gap-8 pb-12 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-7">
          <div ref={summaryRef}>
            <ErrorSummary title={t("write.errors.summary", { n: Object.keys(errors).length })} errors={Object.values(errors).map((message) => ({ message }))} />
          </div>
          {restored && <Notice tone="neutral" icon="refresh">{t("write.draftRestored")}</Notice>}

          <Field label={t("write.community")} help={t("write.communityHelp")} error={errors.community}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} aria-describedby={describedBy} invalid={invalid} value={communityId} onChange={(e) => setCommunityId(e.target.value)}>
                <option value="">—</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(`communities.list.${c.id}.name`)}
                    {account.communities.includes(c.id) ? " ✓" : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {community?.sensitivity === "high" && (
            <Notice tone="info" icon="shield">
              {t("write.sensitiveNote", { community: t(`communities.list.${community.id}.name`) })}
            </Notice>
          )}

          <fieldset>
            <legend className="mb-2 font-medium">{t("write.kind")}</legend>
            <div className="flex flex-wrap gap-2">
              {kinds.map((k) => (
                <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
                  {t(`story.kinds.${k}`)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset aria-describedby="mood-help">
            <legend className="font-medium">{t("write.mood")}</legend>
            <p id="mood-help" className="mb-2 text-sm text-mute">
              {t("write.moodHelp")}
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mood === m}
                  onClick={() => setMood(m)}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] px-4 font-medium transition-colors",
                    mood === m ? cn("border-current", tintClass[moodTint[m]]) : "border-field/70 bg-surface text-ink-2 hover:border-ink-2",
                  )}
                >
                  <span className={cn("size-3 rounded-full", mood === m ? "bg-current" : tintClass[moodTint[m]])} aria-hidden />
                  {t(`story.moods.${m}`)}
                </button>
              ))}
            </div>
            {errors.mood && <p className="mt-2 text-sm font-medium text-warm-ink">{errors.mood}</p>}
          </fieldset>

          <Field label={t("write.titleLabel")} error={errors.title}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("write.titlePlaceholder")} maxLength={120} dir="auto" />
            )}
          </Field>

          <div>
            <p className="mb-2 font-medium" id="prompts">
              {t("write.prompts")}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="prompts">
              {promptKeys.map((p) => (
                <Chip
                  key={p}
                  onClick={() => {
                    const text = t(`write.promptList.${p}`);
                    setBody((b) => (b ? `${b}\n\n${text} ` : `${text} `));
                    requestAnimationFrame(() => bodyRef.current?.focus());
                  }}
                >
                  <Icon name="sparkle" className="size-4" />
                  {t(`write.promptList.${p}`)}
                </Chip>
              ))}
            </div>
          </div>

          <Field label={t("write.body")} help={t("write.bodyHelp")} error={errors.body}>
            {({ id, describedBy, invalid }) => (
              <Textarea ref={bodyRef} id={id} aria-describedby={describedBy} invalid={invalid} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-64 text-lg" maxLength={8000} dir="auto" />
            )}
          </Field>

          {piiKinds.length > 0 && (
            <Notice tone="warm" title={t("write.piiTitle")} icon="shield">
              <span aria-live="polite">{t("write.piiBody", { items: piiKinds.map((k) => t(`write.piiKinds.${k}`)).join(", ") })}</span>
            </Notice>
          )}

          <div className="rounded-lg border border-line bg-surface p-5">
            <Checkbox checked={veilOn} onChange={(e) => setVeilOn(e.target.checked)} label={<span className="font-medium">{t("write.veil")}</span>} help={t("write.veilHelp")} />
            {veilOn && (
              <Field label={t("write.veilLabel")} className="mt-4">
                {({ id }) => <Input id={id} value={veil} onChange={(e) => setVeil(e.target.value)} placeholder={t("write.veilPlaceholder")} maxLength={80} dir="auto" />}
              </Field>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="grid gap-4 rounded-lg border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-sm text-mute" aria-live="polite">
              <Icon name={draftState.status === "saved" ? "check" : "pen"} className="size-4" />
              {draftLabel}
            </p>
            <Button type="submit" size="lg" icon="send" loading={busy}>
              {busy ? t("write.publishing") : t("write.publish")}
            </Button>
            {(title || body) && (
              <Button variant="ghost" size="sm" icon="trash" onClick={() => setDiscardOpen(true)}>
                {t("write.discard")}
              </Button>
            )}
            <p className="text-sm text-mute">{t("guidelines.rules.anon.body")}</p>
          </div>
        </aside>
      </form>
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={t("write.discard")}
        body={t("write.discardConfirm")}
        confirmLabel={t("write.discard")}
        variant="danger"
        onConfirm={async () => {
          await discardDraft();
          setTitle("");
          setBody("");
          setVeil("");
          setVeilOn(false);
          setMood(null);
          setRestored(false);
          setDraftState({ status: "idle" });
        }}
      />
    </>
  );
}
