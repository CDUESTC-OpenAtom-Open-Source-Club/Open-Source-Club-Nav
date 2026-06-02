"use client";

type TrackOutboundClickInput = {
  targetUrl: string;
  targetLabel?: string;
  sourceContext?: string;
  navItemId?: number | null;
};

type ClickEventPayload = {
  navItemId: number | null;
  pagePath: string;
  referrer: string | null;
  targetUrl: string;
  targetLabel: string | null;
  sourceContext: string | null;
  ts: number;
};

const QUEUE_KEY = "kcos_click_queue";
const FLUSH_INTERVAL_MS = 2000;
const MAX_BATCH_SIZE = 20;
const DEDUPE_WINDOW_MS = 800;

let queue: ClickEventPayload[] = [];
let flushTimer: number | null = null;
let lastEventKey = "";
let lastEventTs = 0;

/**
 * Track outbound click with debounce + queue + offline retry.
 * Events are batched and flushed in background.
 */
export function trackOutboundClick(input: TrackOutboundClickInput): void {
  if (typeof window === "undefined") return;

  const event: ClickEventPayload = {
    navItemId: input.navItemId ?? null,
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    targetUrl: input.targetUrl,
    targetLabel: input.targetLabel || null,
    sourceContext: input.sourceContext || null,
    ts: Date.now(),
  };

  const eventKey = `${event.pagePath}|${event.targetUrl}|${event.targetLabel ?? ""}`;
  if (eventKey === lastEventKey && event.ts - lastEventTs < DEDUPE_WINDOW_MS) {
    return;
  }
  lastEventKey = eventKey;
  lastEventTs = event.ts;

  hydrateQueue();
  queue.push(event);
  persistQueue();
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushQueue().catch(() => {});
  }, FLUSH_INTERVAL_MS);
}

async function flushQueue() {
  if (typeof window === "undefined" || queue.length === 0) return;
  if (!navigator.onLine) return;

  const batch = queue.slice(0, MAX_BATCH_SIZE);

  try {
    let sent = 0;
    for (const event of batch) {
      const response = await fetch("/api/metrics/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) break;
      sent += 1;
    }
    if (sent > 0) {
      queue = queue.slice(sent);
      persistQueue();
    }
  } catch {
    // keep queue for retry
  } finally {
    if (queue.length > 0) scheduleFlush();
  }
}

function hydrateQueue() {
  if (queue.length > 0 || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as ClickEventPayload[];
    if (Array.isArray(parsed)) queue = parsed.slice(0, 200);
  } catch {
    queue = [];
  }
}

function persistQueue() {
  if (typeof window === "undefined") return;
  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(QUEUE_KEY);
      return;
    }
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    // ignore storage failures
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    hydrateQueue();
    flushQueue().catch(() => {});
  });
  window.addEventListener("beforeunload", () => {
    if (queue.length === 0) return;
    const first = queue[0];
    try {
      if (navigator.sendBeacon) {
        const payload = JSON.stringify(first);
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/metrics/click", blob);
      }
    } catch {
      // ignore
    }
  });
}
