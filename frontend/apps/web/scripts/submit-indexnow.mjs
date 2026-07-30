#!/usr/bin/env node

/**
 * IndexNow 主动推送脚本
 *
 * 用法：
 *   # 推送默认路由
 *   node scripts/submit-indexnow.mjs
 *
 *   # 推送指定 URL 列表
 *   INDEXNOW_URLS="https://nav.kcos.club/,https://nav.kcos.club/games" node scripts/submit-indexnow.mjs
 *
 *   # 从 sitemap.xml 自动提取 URL
 *   INDEXNOW_FROM_SITEMAP=1 node scripts/submit-indexnow.mjs
 *
 *   # Dry run（仅打印不实际推送）
 *   INDEXNOW_DRY_RUN=1 node scripts/submit-indexnow.mjs
 */

const SITE_URL = "https://nav.kcos.club";
const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY ??
  "kcosclubindexnowkey2026";
const INDEXNOW_ENDPOINT =
  process.env.INDEXNOW_ENDPOINT ?? "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY_LOCATION =
  process.env.INDEXNOW_KEY_LOCATION ??
  new URL(`/${INDEXNOW_KEY}.txt`, SITE_URL).toString();
const DEFAULT_PATHS = ["/", "/games"];

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return new URL(trimmed, SITE_URL).toString();
}

function parseUrlList(value) {
  if (!value) {
    return DEFAULT_PATHS.map((path) => new URL(path, SITE_URL).toString());
  }

  return value
    .split(/[\n,]/)
    .map(normalizeUrl)
    .filter(Boolean);
}

async function fetchUrlsFromSitemap() {
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  console.log(`Fetching sitemap from ${sitemapUrl}`);

  try {
    const res = await fetch(sitemapUrl);
    if (!res.ok) {
      throw new Error(`Sitemap fetch failed: ${res.status}`);
    }
    const xml = await res.text();
    const urls = [];
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      urls.push(match[1].trim());
    }
    return urls;
  } catch (err) {
    console.error("Failed to fetch sitemap, falling back to default paths");
    return DEFAULT_PATHS.map((path) => new URL(path, SITE_URL).toString());
  }
}

async function main() {
  let urlList;

  if (process.env.INDEXNOW_FROM_SITEMAP === "1") {
    urlList = await fetchUrlsFromSitemap();
  } else {
    urlList = Array.from(new Set(parseUrlList(process.env.INDEXNOW_URLS)));
  }

  if (urlList.length === 0) {
    throw new Error("No valid URLs to submit");
  }

  const payload = {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList,
  };

  console.log(`Submitting ${urlList.length} URL(s) to IndexNow`);
  console.log(urlList.map((url) => `- ${url}`).join("\n"));

  if (process.env.INDEXNOW_DRY_RUN === "1") {
    console.log("INDEXNOW_DRY_RUN=1; request skipped");
    process.exit(0);
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `IndexNow rejected the request with ${response.status}: ${responseText}`,
    );
  }

  console.log(`IndexNow accepted the request with ${response.status}`);

  // 同时调用 SEO push API 推送到百度和 Google（如果已配置）
  if (process.env.SEO_PUSH_API_URL) {
    console.log(`\nAlso pushing to Baidu/Google via ${process.env.SEO_PUSH_API_URL}`);
    try {
      const pushRes = await fetch(process.env.SEO_PUSH_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });
      const pushData = await pushRes.json().catch(() => ({}));
      console.log("SEO push result:", JSON.stringify(pushData, null, 2));
    } catch (err) {
      console.error("SEO push API call failed:", err.message);
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
