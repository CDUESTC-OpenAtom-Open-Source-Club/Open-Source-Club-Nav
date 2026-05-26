"use client";

type TrackOutboundClickInput = {
  targetUrl: string;
  targetLabel?: string;
  sourceContext?: string;
  navItemId?: number | null;
};

export function trackOutboundClick(input: TrackOutboundClickInput): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    navItemId: input.navItemId ?? null,
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    targetUrl: input.targetUrl,
    targetLabel: input.targetLabel || null,
    sourceContext: input.sourceContext || null,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/metrics/click", blob);
      return;
    }
  } catch {
    // Ignore and fallback to fetch.
  }

  fetch("/api/metrics/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
