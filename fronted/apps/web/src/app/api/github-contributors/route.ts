const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MAX_REPOS = 12;

type ContributorPayload = {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
};

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

function normalizeRepo(repo: string) {
  const trimmed = repo.trim();
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed) ? trimmed : "";
}

// 服务端内存缓存，按 repos 列表做 key
const contributorsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 90 * 1000; // 90秒缓存

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repos = Array.from(
    new Set(
      (searchParams.get("repos") || "")
        .split(",")
        .map(normalizeRepo)
        .filter(Boolean),
    ),
  ).slice(0, MAX_REPOS);

  if (repos.length === 0) {
    return Response.json(
      { contributors: {}, source: "github" },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  const cacheKey = repos.sort().join(",");

  // 检查缓存
  const cached = contributorsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Response.json(cached.data, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const headers = ghHeaders();
    const entries = await Promise.all(
      repos.map(async (repo) => {
        const res = await fetch(`https://api.github.com/repos/${repo}/contributors`, {
          headers,
          next: { revalidate: 90 },
        });
        if (!res.ok) {
          return [repo, []] as const;
        }

        const payload = (await res.json()) as ContributorPayload[];
        const list = Array.isArray(payload)
          ? payload.slice(0, 5).map((item) => ({
              login: item.login || "",
              avatar: item.avatar_url || "",
              url: item.html_url || "",
              contributions: Number(item.contributions || 0),
            }))
          : [];

        return [repo, list] as const;
      }),
    );

    const result = { contributors: Object.fromEntries(entries), source: "github" };

    // 更新缓存
    contributorsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    // 清理过期缓存（防止内存泄漏）
    if (contributorsCache.size > 50) {
      const now = Date.now();
      for (const [key, val] of contributorsCache) {
        if (now - val.timestamp > CACHE_TTL * 2) {
          contributorsCache.delete(key);
        }
      }
    }

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[github-contributors] GitHub API 请求失败：", error);
    // 出错时尝试返回过期缓存
    if (cached) {
      return Response.json(cached.data, {
        headers: { "Cache-Control": "public, max-age=10", "X-Cache": "STALE" },
      });
    }
    return Response.json(
      { contributors: {}, source: "fallback" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
