"use client";

const STORAGE_KEY = "kcos_visitor_id";

/**
 * Get or create a persistent visitor ID stored in localStorage.
 * Uses crypto.randomUUID() when available, falls out to a simple UUID v4 generator.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = generateUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return generateUUID();
  }
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
