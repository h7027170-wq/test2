"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Community, Mood, ReactionKind, StoryView, Tint } from "@/types/domain";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { Avatar, Badge, tintClass } from "@/components/ui/misc";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonLink } from "@/components/ui/button";
import { setCommunity } from "@/services/auth";

export const moodTint: Record<Mood, Tint> = { heavy: "lilac", low: "sky", okay: "sand", steady: "sage", light: "sage" };
export const reactionKinds: ReactionKind[] = ["relate", "strength", "helped", "thanks"];
const reactionIcon = { relate: "users", strength: "sparkle", helped: "check", thanks: "heart" } as const;

export function MoodBadge({ mood }: { mood: Mood }) {
  const { t } = useI18n();
  return (
    <Badge tint={moodTint[mood]}>
      <span className="size-2 rounded-full bg-current" aria-hidden />
      {t("story.moodLabel", { mood: t(`story.moods.${mood}`) })}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const { t } = useI18n();
  if (role === "therapist")
    return (
      <Badge tone="primary">
        <Icon name="shield" className="size-3.5" />
        {t("story.therapist")}
      </Badge>
    );
  if (role === "moderator" || role === "admin") return <Badge tone="neutral">{t("story.moderator")}</Badge>;
  return null;
}

export function StoryCard({ story, showCommunity = true }: { story: StoryView; showCommunity?: boolean }) {
  const { t, href, relativeTime } = useI18n();
  const total = reactionKinds.reduce((n, k) => n + story.reactions[k].length, 0);
  return (
    <article className="group relative rounded-lg border border-line bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <MoodBadge mood={story.mood} />
        <Badge tone="neutral">{t(`story.kinds.${story.kind}`)}</Badge>
        {story.veil && (
          <Badge tone="warm">
            <Icon name="eyeOff" className="size-3.5" />
            {t("story.veilTitle")}
          </Badge>
        )}
      </div>
      <h3 className="mt-3 text-xl sm:text-2xl" dir="auto">
        <Link href={href(`/stories/${story.id}`)} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none group-has-[a:focus-visible]:outline-3">
          {story.title}
        </Link>
      </h3>
      {story.veil ? (
        <p className="mt-2 text-ink-2">{t("story.veilBody", { note: "" })}<span dir="auto">{story.veil}</span></p>
      ) : (
        <p className="mt-2 line-clamp-3 text-ink-2" dir="auto">
          {story.body}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-mute">
        <span className="inline-flex items-center gap-2">
          <Avatar avatar={story.author.avatar} size={28} />
          <span dir="auto" className="font-medium text-ink-2">
            {story.author.nickname}
          </span>
        </span>
        {showCommunity && <span>{t(`communities.list.${story.communityId}.name`)}</span>}
        <time dateTime={story.createdAt}>{relativeTime(story.createdAt)}</time>
        <span className="ms-auto inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Icon name="heart" className="size-4" />
            {total}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="message" className="size-4" />
            {story.replyCount}
          </span>
        </span>
      </div>
    </article>
  );
}

export function CommunityCard({ community, compact }: { community: Community; compact?: boolean }) {
  const { t, href } = useI18n();
  return (
    <article className={cn("group relative flex flex-col rounded-lg border border-line bg-surface p-5 transition-shadow hover:shadow-md", compact ? "gap-2" : "gap-3 sm:p-6")}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex size-11 items-center justify-center rounded-full", tintClass[community.tint])} aria-hidden>
          <Icon name="wind" />
        </span>
        <SensitivityBadge community={community} />
      </div>
      <h3 className="text-xl">
        <Link href={href(`/communities/${community.id}`)} className="after:absolute after:inset-0 after:rounded-lg">
          {t(`communities.list.${community.id}.name`)}
        </Link>
      </h3>
      {!compact && <p className="text-ink-2">{t(`communities.list.${community.id}.desc`)}</p>}
      <p className="mt-auto text-sm text-mute">{t("communities.members", { n: t("common.placeholderNumber") })}</p>
    </article>
  );
}

export function SensitivityBadge({ community }: { community: Community }) {
  const { t } = useI18n();
  if (community.sensitivity === "standard") return null;
  return (
    <Badge tone={community.sensitivity === "high" ? "warm" : "neutral"}>
      <Icon name={community.sensitivity === "high" ? "shield" : "eyeOff"} className="size-3.5" />
      {t(`communities.sensitivity.${community.sensitivity}`)}
    </Badge>
  );
}

export function JoinButton({ community }: { community: Community }) {
  const { t, href } = useI18n();
  const { account, refresh } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!account) {
    return (
      <ButtonLink href={href("/signup")} icon="users">
        {t("communities.join")}
      </ButtonLink>
    );
  }
  const joined = account.communities.includes(community.id);
  const name = t(`communities.list.${community.id}.name`);
  return (
    <Button
      variant={joined ? "secondary" : "primary"}
      icon={joined ? "check" : "users"}
      loading={busy}
      aria-pressed={joined}
      onClick={async () => {
        setBusy(true);
        await setCommunity(community.id, !joined);
        await refresh();
        setBusy(false);
        toast(t(joined ? "communities.leftToast" : "communities.joinedToast", { name }));
      }}
    >
      {joined ? t("communities.joined") : t("communities.join")}
    </Button>
  );
}

/** Hides a story behind the author's content note until the reader chooses to see it. */
export function ContentVeil({ note, children }: { note: string; children: ReactNode }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  if (shown) {
    return (
      <div>
        <Button variant="ghost" size="sm" icon="eyeOff" onClick={() => setShown(false)} className="mb-3">
          {t("story.veilHide")}
        </Button>
        {children}
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-surface-2 p-6 text-center sm:p-10">
      <Icon name="eyeOff" className="mx-auto size-8 text-ink-2" />
      <p className="mt-3 font-display text-xl font-semibold">{t("story.veilTitle")}</p>
      <p className="mt-2 text-ink-2">
        {t("story.veilBody", { note: "" })}
        <span dir="auto" className="font-medium text-ink">
          {note}
        </span>
      </p>
      <Button variant="secondary" icon="eye" className="mt-5" onClick={() => setShown(true)}>
        {t("story.veilShow")}
      </Button>
    </div>
  );
}

export function PageIntro({ title, lead, children, eyebrow }: { title: string; lead?: string; children?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="container-page pt-10 pb-6 sm:pt-14">
      {eyebrow && <div className="mb-3">{eyebrow}</div>}
      <h1 className="max-w-3xl text-3xl sm:text-4xl">{title}</h1>
      {lead && <p className="mt-4 max-w-reading text-lg text-ink-2">{lead}</p>}
      {children}
    </div>
  );
}

/** Shown in place of member-only screens for guests. */
export function MemberGate({ title, body }: { title: string; body: string }) {
  const { t, href } = useI18n();
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <Icon name="lock" className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl">{title}</h1>
        <p className="mt-2 text-ink-2">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={href("/signup")}>{t("nav.signUp")}</ButtonLink>
          <ButtonLink href={href("/signin")} variant="secondary">
            {t("nav.signIn")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
