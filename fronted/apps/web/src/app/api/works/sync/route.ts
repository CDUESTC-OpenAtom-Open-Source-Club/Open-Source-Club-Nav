// 作品数据同步 API
// POST /api/works/sync - 手动触发同步所有 GITHUB 类型作品的 stars 和 description

import pool from "@/lib/db";

export async function POST() {
  try {
    const [rows] = await pool.query(
      "SELECT id, repo_url FROM works WHERE type = 'GITHUB' AND repo_url IS NOT NULL"
    );
    const githubWorks = rows as { id: number; repo_url: string }[];

    if (githubWorks.length === 0) {
      return Response.json({ message: "没有需要同步的 GITHUB 类型作品", synced: 0 });
    }

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    let synced = 0;
    const errors: string[] = [];

    for (const work of githubWorks) {
      const match = work.repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        errors.push(`${work.repo_url}: URL 格式无效`);
        continue;
      }

      const [, owner, repo] = match;
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (!res.ok) {
          errors.push(`${owner}/${repo}: GitHub API ${res.status}`);
          continue;
        }

        const data = await res.json() as {
          description: string | null;
          stargazers_count: number;
          language: string | null;
        };

        await pool.query(
          "UPDATE works SET description = ?, stars = ?, updated_at = NOW() WHERE id = ?",
          [data.description || "", data.stargazers_count || 0, work.id]
        );
        synced++;
      } catch {
        errors.push(`${owner}/${repo}: 请求失败`);
      }
    }

    return Response.json({ synced, total: githubWorks.length, errors });
  } catch (error) {
    console.error("[works/sync] 同步失败：", error);
    return Response.json({ error: "数据库未配置或同步失败" }, { status: 503 });
  }
}
