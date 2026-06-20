"use client";

import { useEffect, useRef } from "react";
import { recordVisit } from "@/services/stats";
import { getVisitorId } from "@/lib/visitor-id";

/**
 * Tracks page visits by calling the backend /api/metrics/visit endpoint.
 * Renders nothing. Attach once in the root layout.
 */
export default function VisitTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const visitorId = getVisitorId();
    recordVisit(visitorId).catch(() => {
      // silent
    });
  }, []);

  return null;
}
