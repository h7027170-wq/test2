"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import type { ReactionKind, ReplyView, StoryView } from "@/types/domain";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { Button, IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/misc";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { ChoiceCard, Field, Textarea } from "@/components/ui/form";
import { EmptyState, ErrorState, LoadingBlock, Notice, Skeleton } from "@/components/ui/feedback";
import { ContentVeil, MoodBadge, RoleBadge, reactionKinds } from "@/components/nafess/content";
import { NotFoundView } from "@/components/nafess/not-found";
import { useAsync } from "@/lib/use-async";
import { addReply, getStory, listReplies, report, toggleReaction, toggleReplyRelate, toggleSave } from "@/services/content";
import { blockMember } from "@/services/auth";
import { cn } from "@/lib/cn";

const reactionIcon = { relate: "users", strength: "sparkle", helped: "check", thanks: "heart" } as const;

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, href, relativeTime } = useI18n();
  const { account } = useSession();
  const story = useAsync(() => getStory(id), [id, account?.id]);
  const replies = useAsync(() => listReplies(id), [id, account?.id]);

  if (story.state.status === "loading") {
    return (
      <div className="container-page max-w-reading py-12">
        <Skeleton className="h-7 w-40 rounded-pill" />
        <Skeleton className="mt-5 h-12 w-4/5" />
        <div className="mt-8">
          <LoadingBlock lines={5} />
        </div>
      </div>
    );
  }
  if (story.state.status === "error")
    return (
      <div className="container-page py-12">
        <ErrorState onRetry={() => story.reload()} />
      </div>
    );
  const s = story.state.data;
  if (!s) return <NotFoundView title={t("story.notFoundTitle")} body={t("story.notFoundBody")} />;

  const body = (
    <div className="grid gap-5 text-lg leading-[1.75] whitespace-pre-line" dir="auto">
      {s.body}
    </div>
  );

  return (
    <article className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-reading">
        <Link href={href(`/communities/${s.communityId}`)} className="inline-flex min-h-11 items-center gap-2 text-ink-2 hover:text-ink">
          <Icon name="arrow" className="rotate-180" directional />
          {t(`communities.list.${s.communityId}.name`)}
        </Link>
        {s.status === "held" && (
          <Notice tone="info" icon="shield" className="mt-4">
            {t("story.heldBanner")}
          </Notice>
        )}
        {s.status === "rejected" && (
          <Notice tone="warm" className="mt-4">
            {t("story.rejectedBanner", { reason: s.rejectReason ?? "" })}
          </Notice>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <MoodBadge mood={s.mood} />
          <span className="inline-flex items-center rounded-pill bg-surface-2 px-3 py-0.5 text-sm font-medium text-ink-2">{t(`story.kinds.${s.kind}`)}</span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl" dir="auto">
          {s.title}
        </h1>
        <div className="mt-5 flex items-center gap-3">
          <Avatar avatar={s.author.avatar} size={44} />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              <span dir="auto">{s.author.nickname}</span>
              <RoleBadge role={s.author.role} />
            </p>
            <p className="text-sm text-mute">
              <time dateTime={s.createdAt}>{relativeTime(s.createdAt)}</time>
            </p>
          </div>
        </div>

        <div className="mt-8">{s.veil ? <ContentVeil note={s.veil}>{body}</ContentVeil> : body}</div>

        {s.status === "published" && (
          <>
            <ReactionBar story={s} />
            <StoryActions story={s} />
          </>
        )}

        <section aria-labelledby="replies" className="mt-12 border-t border-line pt-8">
          <h2 id="replies" className="text-2xl">
            {t("story.replies")}
            {s.replyCount > 0 && <span className="ms-2 font-sans text-lg font-normal text-mute">({s.replyCount})</span>}
          </h2>
          {s.status === "published" && account && (
            <div className="mt-5">
              <ReplyComposer storyId={s.id} parentId={null} onPosted={() => replies.reload(true)} />
            </div>
          )}
          {!account && (
            <Notice tone="neutral" className="mt-5">
              {t("story.guestPrompt")}{" "}
              <Link href={href("/signup")} className="font-semibold underline underline-offset-4">
                {t("nav.signUp")}
              </Link>
            </Notice>
          )}
          <div className="mt-6">
            {replies.state.status === "loading" && <LoadingBlock />}
            {replies.state.status === "error" && <ErrorState onRetry={() => replies.reload()} />}
            {replies.state.status === "ready" &&
              (replies.state.data.length ? (
                <ul className="grid gap-4">
                  {replies.state.data.map((r) => (
                    <li key={r.id}>
                      <ReplyItem reply={r} storyId={s.id} onChange={() => replies.reload(true)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon="message" title={t("story.noReplies")} />
              ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function ReactionBar({ story }: { story: StoryView }) {
  const { t, href } = useI18n();
  const { account } = useSession();
  const router = useRouter();
  const [reactions, setReactions] = useState(story.reactions);
  return (
    <div role="group" aria-label={t("story.reactions.label")} className="mt-10 flex flex-wrap gap-2">
      {reactionKinds.map((k: ReactionKind) => {
        const mine = !!account && reactions[k].includes(account.id);
        const label = t(`story.reactions.${k}`);
        return (
          <button
            key={k}
            type="button"
            aria-pressed={mine}
            aria-label={t("story.reactions.count", { label, n: reactions[k].length })}
            onClick={async () => {
              if (!account) return router.push(href("/signin"));
              setReactions(await toggleReaction(story.id, k));
            }}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] px-4 text-sm font-medium transition-colors",
              mine ? "border-primary bg-primary-soft text-primary-ink" : "border-field/70 bg-surface text-ink-2 hover:border-ink-2 hover:text-ink",
            )}
          >
            <Icon name={reactionIcon[k]} className="size-4" />
            {label}
            <span className="font-mono tabular-nums" aria-hidden>
              {reactions[k].length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StoryActions({ story }: { story: StoryView }) {
  const { t, href } = useI18n();
  const { account, refresh } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(story.saved);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const isMine = account?.id === story.authorId;
  const needAccount = () => {
    router.push(href("/signin"));
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <Button
        variant="secondary"
        size="sm"
        icon="bookmark"
        aria-pressed={saved}
        onClick={async () => {
          if (!account) return needAccount();
          const v = await toggleSave(story.id);
          setSaved(v);
          toast(t(v ? "story.savedToast" : "story.unsavedToast"));
        }}
        className={cn(saved && "border-primary bg-primary-soft text-primary-ink")}
      >
        {saved ? t("story.saved") : t("story.save")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon="link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href.split("?")[0]);
          } catch {}
          toast(t("common.copied"));
        }}
      >
        {t("story.copyLink")}
      </Button>
      {!isMine && (
        <div className="ms-auto flex gap-1">
          <IconButton icon="flag" label={t("story.report")} onClick={() => (account ? setReportOpen(true) : needAccount())} />
          <IconButton icon="ban" label={t("story.block", { name: story.author.nickname })} onClick={() => (account ? setBlockOpen(true) : needAccount())} />
        </div>
      )}
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} target={{ targetType: "story", targetId: story.id, storyId: story.id }} />
      <ConfirmDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title={t("story.block", { name: story.author.nickname })}
        body={t("story.blockConfirm", { name: story.author.nickname })}
        confirmLabel={t("common.confirm")}
        variant="danger"
        onConfirm={async () => {
          await blockMember(story.authorId);
          await refresh();
          toast(t("story.blockedToast", { name: story.author.nickname }));
          router.push(href(`/communities/${story.communityId}`));
        }}
      />
    </div>
  );
}

function ReportDialog({ open, onClose, target }: { open: boolean; onClose: () => void; target: { targetType: "story" | "reply"; targetId: string; storyId: string } }) {
  const { t } = useI18n();
  const toast = useToast();
  const [reason, setReason] = useState<"identifying" | "harmful" | "harassment" | "spam" | "other" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => {
    setReason(null);
    setNote("");
    setError(null);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={t("report.title")}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              if (!reason) return setError(t("report.chooseReason"));
              setBusy(true);
              await report({ ...target, reason, note });
              setBusy(false);
              toast(t("report.sent"));
              close();
            }}
          >
            {t("report.submit")}
          </Button>
        </>
      }
    >
      <p className="text-ink-2">{t("report.lead")}</p>
      <fieldset className="mt-4">
        <legend className="mb-2 font-medium">{t("report.reason")}</legend>
        {error && (
          <p className="mb-2 text-sm font-medium text-warm-ink" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-2">
          {(["identifying", "harmful", "harassment", "spam", "other"] as const).map((r) => (
            <ChoiceCard key={r} type="radio" name="reason" checked={reason === r} onChange={() => (setReason(r), setError(null))} title={t(`report.reasons.${r}`)} className="py-3" />
          ))}
        </div>
      </fieldset>
      <Field label={t("report.note")} optional={t("common.optional")} className="mt-4">
        {({ id }) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="min-h-24" />}
      </Field>
    </Dialog>
  );
}

function ReplyItem({ reply, storyId, onChange, nested }: { reply: ReplyView; storyId: string; onChange: () => void; nested?: boolean }) {
  const { t, relativeTime } = useI18n();
  const { account } = useSession();
  const [replying, setReplying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const related = !!account && reply.relates.includes(account.id);
  return (
    <div className={cn("rounded-lg bg-surface p-4 sm:p-5", nested ? "border-s-[3px] border-line bg-surface-2/60" : "border border-line")}>
      <div className="flex items-center gap-3">
        <Avatar avatar={reply.author.avatar} size={32} />
        <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold" dir="auto">
            {reply.author.nickname}
          </span>
          <RoleBadge role={reply.author.role} />
          <time className="text-mute" dateTime={reply.createdAt}>
            {relativeTime(reply.createdAt)}
          </time>
        </p>
      </div>
      {reply.status === "held" && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-ink">
          <Icon name="shield" className="size-4" />
          {t("story.heldBanner")}
        </p>
      )}
      <p className="mt-2 whitespace-pre-line" dir="auto">
        {reply.body}
      </p>
      {account && reply.status === "published" && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
          <Button
            variant="ghost"
            size="sm"
            icon="users"
            aria-pressed={related}
            onClick={async () => {
              await toggleReplyRelate(reply.id);
              onChange();
            }}
            className={cn("no-underline!", related && "text-primary-ink")}
          >
            {t("story.relate")} {reply.relates.length > 0 && `· ${reply.relates.length}`}
          </Button>
          <Button variant="ghost" size="sm" icon="message" onClick={() => setReplying((r) => !r)} aria-expanded={replying} className="no-underline!">
            {t("story.reply")}
          </Button>
          {account.id !== reply.authorId && <IconButton icon="flag" label={t("story.report")} onClick={() => setReportOpen(true)} className="ms-auto" />}
        </div>
      )}
      {replying && (
        <div className="mt-3">
          <ReplyComposer
            storyId={storyId}
            parentId={reply.id}
            label={t("story.replyTo", { name: reply.author.nickname })}
            autoFocus
            onPosted={() => {
              setReplying(false);
              onChange();
            }}
          />
        </div>
      )}
      {reply.children.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {reply.children.map((c) => (
            <li key={c.id}>
              <ReplyItem reply={c} storyId={storyId} onChange={onChange} nested />
            </li>
          ))}
        </ul>
      )}
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} target={{ targetType: "reply", targetId: reply.id, storyId }} />
    </div>
  );
}

function ReplyComposer({ storyId, parentId, onPosted, label, autoFocus }: { storyId: string; parentId: string | null; onPosted: () => void; label?: string; autoFocus?: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        const res = await addReply(storyId, parentId, body);
        setBusy(false);
        if (res.ok) {
          setBody("");
          setHeld(res.held);
          if (!res.held) toast(t("story.replyPosted"));
          onPosted();
        }
      }}
    >
      <Field label={label ?? t("story.reply")}>
        {({ id }) => <Textarea id={id} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("story.replyPlaceholder")} className="min-h-24" maxLength={2000} autoFocus={autoFocus} dir="auto" />}
      </Field>
      {held && (
        <Notice tone="info" icon="shield" className="mt-3">
          {t("story.replyHeld")}
        </Notice>
      )}
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" icon="send" loading={busy} disabled={!body.trim()}>
          {t("story.replySend")}
        </Button>
      </div>
    </form>
  );
}

