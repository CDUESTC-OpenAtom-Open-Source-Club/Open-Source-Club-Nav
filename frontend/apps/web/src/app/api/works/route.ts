// @route-desc BFF API route proxy/handler for /api/works/route.ts
// 鍓嶅彴浣滃搧鍒楄〃 - 鍓嶇 BFF 鐩存帴璋冪敤 GitHub API 鑾峰彇缁勭粐浠撳簱
import { GITHUB_ORG } from "@/data/githubActivity";

export const revalidate = 60;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

const COLORS = [
  "#0A84FF", "#06E5CC", "#7C3AED", "#F59E0B",
  "#EF4444", "#10B981", "#38BDF8", "#EC4899",
];

// 鏈嶅姟绔唴瀛樼紦瀛橈紝閬垮厤姣忔璇锋眰閮芥墦 GitHub API
let cachedWorks: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60绉掔紦瀛?

export async function GET() {
  try {
    // 妫€鏌ョ紦瀛?
    if (cachedWorks && Date.now() - cachedWorks.timestamp < CACHE_TTL) {
      return Response.json(cachedWorks.data, {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
          "X-Cache": "HIT",
        },
      });
    }

    const res = await fetch(
      `https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&sort=updated`,
      { headers: ghHeaders(), next: { revalidate: 60 } },
    );

    if (!res.ok) {
      // GitHub API 澶辫触鏃讹紝濡傛灉鏈夎繃鏈熺紦瀛橈紝浠嶇劧杩斿洖
      if (cachedWorks) {
        return Response.json(cachedWorks.data, {
          headers: { "Cache-Control": "public, max-age=10", "X-Cache": "STALE" },
        });
      }
      return Response.json(
        { works: [], source: "github-error" },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const repos = await res.json();

    // 杩囨护 fork 浠撳簱锛屾槧灏勪负鍓嶇鎵€闇€缁撴瀯
    const works = repos
      .filter((repo: any) => !repo.fork)
      .map((repo: any, i: number) => {
        const lang = repo.language || "";
        const status = repo.archived ? "已归档" : "开发中";

        return {
          id: repo.id,
          type: "GITHUB",
          repo_url: repo.html_url || null,
          title: repo.name || "untitled",
          description: repo.description || "",
          author_name: repo.owner?.login || GITHUB_ORG,
          author_avatar: (repo.owner?.login || GITHUB_ORG).slice(0, 2).toUpperCase(),
          tags: lang ? [lang] : [],
          color: COLORS[i % COLORS.length],
          status,
          stars: repo.stargazers_count || 0,
          preview_url: repo.homepage || null,
          is_featured: 1,
          display_order: i + 1,
          source: "github",
        };
      });

    const result = { works, source: "github" };

    // 鏇存柊缂撳瓨
    cachedWorks = { data: result, timestamp: Date.now() };

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[works] GitHub API request failed:", error);
    // 鍑洪敊鏃跺皾璇曡繑鍥炶繃鏈熺紦瀛?
    if (cachedWorks) {
      return Response.json(cachedWorks.data, {
        headers: { "Cache-Control": "public, max-age=10", "X-Cache": "STALE-FALLBACK" },
      });
    }
    return Response.json(
      { works: [], source: "error" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

// POST 浠嶇劧浠ｇ悊鍒板悗绔紙绠＄悊鎿嶄綔锛?
import { fetchBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return fetchBackend(request, "/api/admin/works");
}

