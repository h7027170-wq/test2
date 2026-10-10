"use client";

import { ErrorState } from "@/components/ui/feedback";

export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-14">
      <ErrorState onRetry={reset} />
    </div>
  );
}
