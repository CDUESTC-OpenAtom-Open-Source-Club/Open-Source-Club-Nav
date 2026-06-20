/**
 * SEO 推流工具库（服务端专用）
 *
 * 集成三大搜索引擎的主动推送 API：
 * 1. 百度站长推送 — POST http://data.zz.baidu.com/urls?site=xxx&token=xxx
 * 2. Google Indexing API — POST https://indexing.googleapis.com/v3/urlNotifications:publish
 * 3. IndexNow — POST https://api.indexnow.org/indexnow (Bing/Yandex/Seznam 等)
 *
 * 环境变量配置：
 * - BAIDU_PUSH_SITE: 百度站长平台验证站点域名
 * - BAIDU_PUSH_TOKEN: 百度推送准入密钥
 * - GOOGLE_INDEXING_CLIENT_EMAIL: Google Service Account 邮箱
 * - GOOGLE_INDEXING_PRIVATE_KEY: Google Service Account 私钥
 * - INDEXNOW_KEY: IndexNow 密钥
 */

import { SITE_URL } from "./site";

export interface PushResult {
  engine: "baidu" | "google" | "indexnow";
  success: boolean;
  status: number;
  message: string;
  remaining?: number;
}

// ─── 百度站长推送 ──────────────────────────────────────────

/**
 * 向百度搜索引擎主动推送 URL 列表
 * 文档：https://ziyuan.baidu.com/linksubmit/index
 */
export async function pushToBaidu(urls: string[]): Promise<PushResult> {
  const site = process.env.BAIDU_PUSH_SITE;
  const token = process.env.BAIDU_PUSH_TOKEN;

  if (!site || !token) {
    return {
      engine: "baidu",
      success: false,
      status: 0,
      message: "BAIDU_PUSH_SITE 或 BAIDU_PUSH_TOKEN 未配置，跳过百度推送",
    };
  }

  const endpoint = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`;
  const body = urls.join("\n");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });

    const data = await res.json().catch(() => ({}));
    const remaining =
      typeof data.remain === "number" ? data.remain : undefined;

    if (res.ok && data.success > 0) {
      return {
        engine: "baidu",
        success: true,
        status: res.status,
        message: `百度推送成功，共 ${data.success} 条`,
        remaining,
      };
    }

    return {
      engine: "baidu",
      success: false,
      status: res.status,
      message: `百度推送失败: ${data.message ?? JSON.stringify(data)}`,
      remaining,
    };
  } catch (err) {
    return {
      engine: "baidu",
      success: false,
      status: 0,
      message: `百度推送异常: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Google Indexing API ───────────────────────────────────

/**
 * 获取 Google Service Account JWT 并换取 access_token
 */
async function getGoogleAccessToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) return null;

  try {
    // 构建 JWT
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "");
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "");
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // 使用 Web Crypto API 签名
    const keyData = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      keyData,
      encoder.encode(unsignedToken),
    );

    const signatureB64 = arrayBufferToBase64(signature).replace(/=/g, "");
    const jwt = `${unsignedToken}.${signatureB64}`;

    // 换取 access_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch {
    return null;
  }
}

/**
 * 向 Google Indexing API 主动推送 URL
 * 文档：https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */
export async function pushToGoogle(urls: string[]): Promise<PushResult> {
  const accessToken = await getGoogleAccessToken();

  if (!accessToken) {
    return {
      engine: "google",
      success: false,
      status: 0,
      message: "Google Service Account 未配置或获取 token 失败，跳过 Google 推送",
    };
  }

  let successCount = 0;
  let lastError = "";

  for (const url of urls) {
    try {
      const res = await fetch(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            url,
            type: "URL_UPDATED",
          }),
        },
      );

      if (res.ok) {
        successCount++;
      } else {
        const data = await res.json().catch(() => ({}));
        lastError = data.error?.message ?? `HTTP ${res.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    engine: "google",
    success: successCount > 0,
    status: 200,
    message:
      successCount === urls.length
        ? `Google 推送成功，共 ${successCount} 条`
        : `Google 推送部分成功: ${successCount}/${urls.length}${lastError ? `，错误: ${lastError}` : ""}`,
  };
}

// ─── IndexNow 推送 ─────────────────────────────────────────

const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY ??
  "5907708b80858fe5224ecf14aa02be50c9024818ed5459018e17cbe51e37812a";

/**
 * 向 IndexNow 推送 URL（Bing/Yandex/Naver/Seznam 等联合索引）
 * 文档：https://www.indexnow.org/documentation
 */
export async function pushToIndexNow(urls: string[]): Promise<PushResult> {
  const host = new URL(SITE_URL).host;
  const keyLocation = new URL(`/${INDEXNOW_KEY}.txt`, SITE_URL).toString();

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      return {
        engine: "indexnow",
        success: true,
        status: res.status,
        message: `IndexNow 推送成功，共 ${urls.length} 条`,
      };
    }

    const text = await res.text();
    return {
      engine: "indexnow",
      success: false,
      status: res.status,
      message: `IndexNow 推送失败: ${text}`,
    };
  } catch (err) {
    return {
      engine: "indexnow",
      success: false,
      status: 0,
      message: `IndexNow 推送异常: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── 统一推送入口 ──────────────────────────────────────────

export interface PushAllOptions {
  engines?: ("baidu" | "google" | "indexnow")[];
}

export async function pushUrlsToAllEngines(
  urls: string[],
  options?: PushAllOptions,
): Promise<PushResult[]> {
  const engines = options?.engines ?? ["baidu", "google", "indexnow"];
  const results: PushResult[] = [];

  // 并行推送所有引擎
  const tasks = engines.map((engine) => {
    switch (engine) {
      case "baidu":
        return pushToBaidu(urls);
      case "google":
        return pushToGoogle(urls);
      case "indexnow":
        return pushToIndexNow(urls);
    }
  });

  const settled = await Promise.allSettled(tasks);
  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      results.push({
        engine: "indexnow",
        success: false,
        status: 0,
        message: `推送异常: ${result.reason}`,
      });
    }
  }

  return results;
}

// ─── 工具函数 ──────────────────────────────────────────────

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContent = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryString = atob(pemContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
