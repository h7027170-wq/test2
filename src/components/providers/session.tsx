"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { me, type SessionAccount } from "@/services/auth";
import { unreadCount } from "@/services/notifications";

interface Session {
  account: SessionAccount | null;
  status: "loading" | "ready";
  unread: number;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Session | null>(null);

/** Mirrors GET /api/auth/me. Pages render as a guest first; member-specific parts appear once this resolves. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<SessionAccount | null>(null);
  const [status, setStatus] = useState<Session["status"]>("loading");
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const [a, n] = await Promise.all([me(), unreadCount()]);
    setAccount(a);
    setUnread(n);
    setStatus("ready");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the session is an external sync
    void refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ account, status, unread, refresh }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}
