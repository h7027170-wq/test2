"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> = { status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T };

/** Runs an async loader and exposes loading / error / ready states plus reload(). Reloads when deps change. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const loaderRef = useRef(loader);
  const run = useRef(0);
  const key = JSON.stringify(deps);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async (quiet = false) => {
    const id = ++run.current;
    if (!quiet) setState({ status: "loading" });
    try {
      const data = await loaderRef.current();
      if (id === run.current) setState({ status: "ready", data });
    } catch (e) {
      if (id === run.current) setState({ status: "error", error: e as Error });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching when deps change
    void reload();
  }, [key, reload]);

  return { state, reload };
}
