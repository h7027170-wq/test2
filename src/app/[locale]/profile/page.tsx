"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n";
import { useSession } from "@/components/providers/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Card } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState, LoadingBlock, Notice } from "@/components/ui/feedback";
import { MemberGate, PageIntro } from "@/components/nafess/content";
import { RecoveryCodeBox } from "@/components/nafess/recovery-code";
import { useAsync } from "@/lib/use-async";
import { listMyStories } from "@/services/content";
import { regenerateRecoveryCode, unblockMember } from "@/services/auth";

export default function ProfilePage() {
  const { t, href } = useI18n();
  const { account, status, refresh } = useSession();
  const stories = useAsync(() => (account ? listMyStories() : Promise.resolve([])), [account?.id]);
  const [confirmCode, setConfirmCode] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  if (status === "loading")
    return (
      <div className="container-page py-14">
        <LoadingBlock lines={5} />
      </div>
    );
  if (!account) return <MemberGate title={t("profile.title")} body={t("story.guestPrompt")} />;

  return (
    <>
      <PageIntro title={t("profile.title")}>
        <div className="mt-6 flex items-center gap-4">
          <Avatar avatar={account.avatar} size={64} />
          <div>
            <p className="text-2xl font-semibold" dir="auto">
              {account.nickname}
            </p>
            <p className="text-ink-2">
              {t("profile.ageRange")}: {account.ageRange}
            </p>
          </div>
        </div>
        <Notice tone="neutral" icon="lock" className="mt-6 max-w-reading">
          {t("profile.private")}
        </Notice>
      </PageIntro>

      <div className="container-page grid gap-6 pb-10 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl">{t("profile.communities")}</h2>
          {account.communities.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {account.communities.map((c) => (
                <li key={c}>
                  <Link href={href(`/communities/${c}`)} className="inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-field/70 px-4 hover:border-ink-2">
                    {t(`communities.list.${c}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-ink-2">{t("profile.noCommunities")}</p>
          )}
          <ButtonLink href={href("/communities")} variant="ghost" iconEnd="arrow" className="mt-4">
            {t("saved.browse")}
          </ButtonLink>
        </Card>

        <Card>
          <h2 className="text-2xl">{t("profile.recovery")}</h2>
          {account.recoveryMethod === "none" && (
            <Notice tone="warm" className="mt-4">
              {t("profile.recoveryNone")}
            </Notice>
          )}
          {account.recoveryMethod === "code" && (
            <p className="mt-3 flex items-start gap-2 text-ink-2">
              <Icon name="key" className="mt-1" />
              {t("profile.recoveryCodeSet")}
            </p>
          )}
          {account.recoveryMethod === "email" && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-ink-2">
              <Icon name="mail" />
              {t("profile.recoveryEmailSet")}
              <Badge tone={account.emailVerified ? "primary" : "warm"}>{account.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}</Badge>
            </p>
          )}
          {newCode ? (
            <div className="mt-4">
              <RecoveryCodeBox code={newCode} />
            </div>
          ) : (
            <Button variant="secondary" size="sm" icon="key" className="mt-4" onClick={() => setConfirmCode(true)}>
              {t("profile.newCode")}
            </Button>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-2xl">{t("profile.myStories")}</h2>
          {stories.state.status === "loading" && (
            <div className="mt-4">
              <LoadingBlock />
            </div>
          )}
          {stories.state.status === "error" && <ErrorState onRetry={() => stories.reload()} />}
          {stories.state.status === "ready" &&
            (stories.state.data.length ? (
              <ul className="mt-4 divide-y divide-line">
                {stories.state.data.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={href(`/stories/${s.id}`)} className="min-w-0 font-medium underline-offset-4 hover:underline" dir="auto">
                      {s.title}
                    </Link>
                    <Badge tone={s.status === "published" ? "primary" : s.status === "held" ? "neutral" : "warm"}>{t(`profile.status.${s.status}`)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink-2">{t("profile.noStories")}</p>
            ))}
        </Card>

        <Card>
          <h2 className="text-2xl">{t("profile.privacy")}</h2>
          <ul className="mt-4 grid gap-3">
            {(["nickname", "age", "email", "delete"] as const).map((k) => (
              <li key={k} className="flex items-start gap-3 text-ink-2">
                <Icon name="lock" className="mt-1 text-primary-ink" />
                {t(`profile.privacyPoints.${k}`)}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl">{t("profile.blocked")}</h2>
          {account.blocked.length ? (
            <ul className="mt-4 grid gap-2">
              {account.blocked.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-ink-2">{id}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await unblockMember(id);
                      await refresh();
                    }}
                  >
                    {t("profile.unblock")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-ink-2">{t("profile.noBlocked")}</p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmCode}
        onClose={() => setConfirmCode(false)}
        title={t("profile.newCode")}
        body={t("profile.newCodeConfirm")}
        confirmLabel={t("common.continue")}
        onConfirm={async () => {
          setNewCode(await regenerateRecoveryCode());
          await refresh();
        }}
      />
    </>
  );
}
