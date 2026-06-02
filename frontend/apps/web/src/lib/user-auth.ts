"use client";

export type UserTokenPayload = {
  token: string;
  expiresAt?: number;
};

const USER_TOKEN_KEY = "kcos_user_token";
let memoryToken: UserTokenPayload | null = null;

/**
 * Persist user token in session storage (preferred) with in-memory fallback.
 * Avoids localStorage long-term persistence risk.
 */
export function setUserToken(payload: UserTokenPayload): void {
  memoryToken = payload;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(USER_TOKEN_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

/**
 * Read token from memory/session storage and auto-clear expired token.
 */
export function getUserToken(): string | null {
  const entry = readUserTokenPayload();
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    clearUserToken();
    return null;
  }
  return entry.token;
}

/**
 * Remove token from memory/session storage.
 */
export function clearUserToken(): void {
  memoryToken = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(USER_TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

/**
 * Build Authorization header only when token exists.
 */
export function withUserAuthHeader(
  headers: Record<string, string> = {},
): Record<string, string> {
  const token = getUserToken();
  if (!token) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

function readUserTokenPayload(): UserTokenPayload | null {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(USER_TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserTokenPayload;
    if (!parsed?.token) return null;
    memoryToken = parsed;
    return parsed;
  } catch {
    return null;
  }
}
