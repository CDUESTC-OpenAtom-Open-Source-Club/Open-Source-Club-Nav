import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type AdminRole = "super" | "editor";

export interface AdminSession {
  userId: number;
  username: string;
  role: AdminRole;
  exp: number;
}

export const ADMIN_SESSION_COOKIE = "kcos_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const DEFAULT_DEV_AUTH_SECRET = "kcos-admin-dev-secret-change-me";

function getAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (secret && secret.length > 0) return secret;
  // 生产环境严禁回退到内置默认密钥，否则会话可被伪造，必须显式配置。
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_AUTH_SECRET 未配置：生产环境必须显式设置后台会话签名密钥");
  }
  return DEFAULT_DEV_AUTH_SECRET;
}

export function isAdminBypassEnabled(): boolean {
  // 默认安全：仅当显式设置 ADMIN_BYPASS_LOGIN=true 且非生产环境时才放行绕过。
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ADMIN_BYPASS_LOGIN === "true";
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64");
}

export function hashPassword(password: string): string {
  // 后台密码使用 scrypt + salt 存储，避免明文落库。
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const parts = passwordHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, digestHex] = parts;
  const computed = scryptSync(password, salt, 64);
  const stored = Buffer.from(digestHex, "hex");
  if (stored.length !== computed.length) return false;
  return timingSafeEqual(stored, computed);
}

export function createSessionToken(session: Omit<AdminSession, "exp">): string {
  // Session token 采用“payload + HMAC 签名”结构，避免服务端额外存会话表。
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload: AdminSession = { ...session, exp };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    createHmac("sha256", getAuthSecret()).update(body).digest(),
  );
  return `${body}.${signature}`;
}

export function verifySessionToken(token?: string | null): AdminSession | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = base64UrlEncode(
    createHmac("sha256", getAuthSecret()).update(body).digest(),
  );
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body).toString("utf8")) as AdminSession;
    if (!payload?.userId || !payload?.role || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "super" && payload.role !== "editor") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  // 后台登录态统一落到 httpOnly Cookie，前端脚本不可直接读取。
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  // 开发阶段默认允许 bypass，方便在无数据库时进入后台联调。
  if (isAdminBypassEnabled()) {
    return {
      userId: 0,
      username: "bypass-admin",
      role: "super",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
