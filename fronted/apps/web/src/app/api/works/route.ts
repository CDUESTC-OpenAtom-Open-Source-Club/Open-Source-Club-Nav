// 前台作品列表 - 前端 BFF 直接调用 GitHub API 获取组织仓库
import { GITHUB_ORG } from "@/data/githubActivity";

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

// 服务端内存缓存，避免每次请求都打 GitHub API
let cachedWorks: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60秒缓存

export async function GET() {
  try {
    // 检查缓存
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
      // GitHub API 失败时，如果有过期缓存，仍然返回
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

    // 过滤 fork 仓库，映射为前端所需结构
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

    // 更新缓存
    cachedWorks = { data: result, timestamp: Date.now() };

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[works] GitHub API 请求失败：", error);
    // 出错时尝试返回过期缓存
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

// POST 仍然代理到后端（管理操作）
import { proxyRequest } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyRequest(request, "/api/admin/works");
}
