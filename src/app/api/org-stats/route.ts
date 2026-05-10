// 组织统计数据 API
// 从 GitHub 获取成员数、项目数、Star 总数

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const GITHUB_ORG = "CDUESTC-OpenAtom-Open-Source-Club";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const MOCK_STATS = {
  members: 42,
  projects: 18,
  stars: 1200,
  source: "mock",
};

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

export async function GET() {
  if (USE_MOCK) {
    return Response.json(MOCK_STATS);
  }

  try {
    const headers = ghHeaders();

    // 并行请求：组织信息、公开成员、仓库列表
    const [orgRes, membersRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/orgs/${GITHUB_ORG}`, { headers, next: { revalidate: 300 } }),
      fetch(`https://api.github.com/orgs/${GITHUB_ORG}/members?per_page=100`, { headers, next: { revalidate: 300 } }),
      fetch(`https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100`, { headers, next: { revalidate: 300 } }),
    ]);

    // 组织信息（兜底）
    let projects = 0;
    if (orgRes.ok) {
      const org = await orgRes.json();
      projects = (org as { public_repos: number }).public_repos || 0;
    }

    // 公开成员数
    let members = 0;
    if (membersRes.ok) {
      const list = await membersRes.json();
      members = Array.isArray(list) ? list.length : 0;
    }

    // Star 总数（排除 fork）
    let stars = 0;
    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        stars = repos
          .filter((r: { fork: boolean }) => !r.fork)
          .reduce((sum: number, r: { stargazers_count: number }) => sum + (r.stargazers_count || 0), 0);
      }
    }

    return Response.json({ members, projects, stars, source: "github" });
  } catch (err) {
    console.error("[org-stats] GitHub API 失败:", (err as Error).message);
    return Response.json({ ...MOCK_STATS, source: "fallback" });
  }
}
