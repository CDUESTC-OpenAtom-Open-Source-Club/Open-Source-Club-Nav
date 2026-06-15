#!/usr/bin/env node

const SITE_URL = "https://nav.kcos.club";
const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY ??
  "5907708b80858fe5224ecf14aa02be50c9024818ed5459018e17cbe51e37812a";
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

const urlList = Array.from(new Set(parseUrlList(process.env.INDEXNOW_URLS)));
if (urlList.length === 0) {
  throw new Error("INDEXNOW_URLS did not contain any valid URLs");
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
