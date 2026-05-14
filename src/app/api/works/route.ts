// 作品列表接口。
// GET：优先读取 GitHub 组织仓库，其次读取 MySQL，最后回退到静态数据。
// POST：支持手动新增作品，也支持根据 GitHub 仓库地址补全信息。

import pool from "@/lib/db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const GITHUB_ORG = "CDUESTC-OpenAtom-Open-Source-Club";

// GitHub 仓库没有自定义主题色时，按顺序分配展示色。
const COLORS = ["#0A84FF", "#06E5CC", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#38BDF8", "#EC4899"];

// 所有真实数据源都不可用时，前台仍可展示这组静态作品。
const FALLBACK_WORKS = [
  { id: 1, type: "MANUAL", repo_url: null, title: "选课助手 Pro", description: "自动抢课 / 冲突检测 / 课表可视化", author_name: "Zhang Wei", author_avatar: "ZW", tags: ["React", "Python", "FastAPI"], color: "#0A84FF", status: "已上线", stars: 128, preview_url: null, is_featured: 1, display_order: 1 },
  { id: 2, type: "MANUAL", repo_url: null, title: "校园外卖比价器", description: "实时比价 / 拼单功能 / 历史价格趋势", author_name: "Liu Fang", author_avatar: "LF", tags: ["Vue3", "Node.js", "Redis"], color: "#06E5CC", status: "开发中", stars: 87, preview_url: null, is_featured: 1, display_order: 2 },
  { id: 3, type: "MANUAL", repo_url: null, title: "摸鱼时钟", description: "番茄钟 / 任务追踪 / 团队协作看板", author_name: "Chen Hao", author_avatar: "CH", tags: ["TypeScript", "Prisma", "WebSocket"], color: "#7C3AED", status: "已上线", stars: 203, preview_url: null, is_featured: 1, display_order: 3 },
  { id: 4, type: "MANUAL", repo_url: null, title: "OpenAI 实验室", description: "大模型 Prompt 调试 / 对话记录云端同步", author_name: "Wang Jing", author_avatar: "WJ", tags: ["Next.js", "OpenAI API", "Supabase"], color: "#F59E0B", status: "内测中", stars: 156, preview_url: null, is_featured: 1, display_order: 4 },
  { id: 5, type: "MANUAL", repo_url: null, title: "成电路线导航", description: "室内导航 / 空教室查询 / 一键打印路线", author_name: "Li Ming", author_avatar: "LM", tags: ["Flutter", "Go", "PostgreSQL"], color: "#EF4444", status: "已上线", stars: 94, preview_url: null, is_featured: 1, display_order: 5 },
  { id: 6, type: "MANUAL", repo_url: null, title: "HexBoard", description: "极简六边形笔记板 / Markdown / 本地优先", author_name: "Zhao Yu", author_avatar: "ZY", tags: ["Electron", "SQLite", "ProseMirror"], color: "#10B981", status: "已上线", stars: 312, preview_url: null, is_featured: 1, display_order: 6 },
  { id: 7, type: "MANUAL", repo_url: null, title: "StarLink CLI", description: "Git 工作流工具 / 自动化提交规范", author_name: "Sun Lei", author_avatar: "SL", tags: ["Rust", "CLI", "Shell"], color: "#38BDF8", status: "开发中", stars: 67, preview_url: null, is_featured: 1, display_order: 7 },
  { id: 8, type: "MANUAL", repo_url: null, title: "开源贡献看板", description: "社团成员贡献可视化 / GitHub Stats", author_name: "Huang Xin", author_avatar: "HX", tags: ["D3.js", "GitHub API", "Vercel"], color: "#EC4899", status: "已上线", stars: 143, preview_url: null, is_featured: 1, display_order: 8 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRepo(repo: any, index: number) {
  // GitHub 返回结构和前台展示结构不同，这里统一转换成页面可直接消费的格式。
  const owner = repo.owner?.login || GITHUB_ORG;
  const authorAvatar = owner.slice(0, 2).toUpperCase();

  return {
    id: index + 1,
    type: "GITHUB",
    repo_url: repo.html_url,
    title: repo.name || "untitled",
    description: repo.description || "",
    author_name: owner,
    author_avatar: authorAvatar,
    tags: repo.language ? [repo.language] : [],
    color: COLORS[index % COLORS.length],
    status: repo.archived ? "已归档" : "开发中",
    stars: repo.stargazers_count || 0,
    preview_url: repo.homepage || null,
    is_featured: 1,
    display_order: index + 1,
  };
}

async function fetchGitHubWorks() {
  // GitHub 接口读取统一收口到这里，便于后续增加缓存或限流处理。
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&sort=updated`,
    { headers, next: { revalidate: 120 } }
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repos = await res.json() as any[];
  return repos
    // 前台默认不展示 fork 仓库，避免作品列表被镜像仓库污染。
    .filter((r) => !r.fork)
    .map((r, i) => transformRepo(r, i));
}

export async function GET() {
  // mock 模式直接返回静态作品，用于本地开发和演示。
  if (USE_MOCK) {
    return Response.json({ works: FALLBACK_WORKS, source: "mock" });
  }

  // 优先从 GitHub 读取真实仓库信息，保证作品数据尽量最新。
  try {
    const works = await fetchGitHubWorks();
    return Response.json({ works, source: "github" });
  } catch (err) {
    console.warn("[works] GitHub API 不可用，尝试 MySQL:", (err as Error).message);
  }

  // GitHub 不可用时再回退到 MySQL。
  try {
    const [rows] = await pool.query(
      "SELECT * FROM works WHERE is_featured = 1 ORDER BY display_order ASC"
    );
    const works = (rows as Record<string, unknown>[]).map((row) => ({
      ...row,
      tags: typeof row.tags === "string" ? JSON.parse(row.tags as string) : row.tags,
    }));
    return Response.json({ works, source: "mysql" });
  } catch {
    console.warn("[works] MySQL 不可用，返回静态数据");
  }

  // 两个真实数据源都不可用时，最终回退到静态作品。
  return Response.json({ works: FALLBACK_WORKS, source: "fallback" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, repo_url, title, description, author_name, author_avatar, tags, color, status, stars, preview_url, is_featured, display_order } = body;

    if (!title || !author_name) {
      return Response.json({ error: "title 和 author_name 为必填项" }, { status: 400 });
    }

    let finalTitle = title;
    let finalDesc = description || "";
    let finalStars = stars || 0;
    let finalTags = tags || [];
    let finalAvatar = author_avatar || author_name.slice(0, 2).toUpperCase();

    // GITHUB 类型支持通过 repo_url 自动补全仓库描述、语言和星标。
    if (type === "GITHUB" && repo_url) {
      const match = repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, owner, repo] = match;
        try {
          const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
            },
          });
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            finalTitle = finalTitle || (ghData as { name: string }).name;
            finalDesc = finalDesc || (ghData as { description: string }).description || "";
            finalStars = (ghData as { stargazers_count: number }).stargazers_count || 0;
            const langs = (ghData as { language: string }).language ? [(ghData as { language: string }).language] : [];
            finalTags = finalTags.length ? finalTags : langs;
          }
        } catch {
          console.warn("[works] GitHub API 请求失败，使用手动填写的数据");
        }
      }
    }

    const [result] = await pool.query(
      `INSERT INTO works (type, repo_url, title, description, author_name, author_avatar, tags, color, status, stars, preview_url, is_featured, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type || "MANUAL",
        repo_url || null,
        finalTitle,
        finalDesc,
        author_name,
        finalAvatar,
        JSON.stringify(finalTags),
        color || "#0A84FF",
        status || "开发中",
        finalStars,
        preview_url || null,
        is_featured !== false ? 1 : 0,
        display_order || 0,
      ]
    );

    const insertId = (result as { insertId: number }).insertId;
    const [rows] = await pool.query("SELECT * FROM works WHERE id = ?", [insertId]);
    const work = (rows as Record<string, unknown>[])[0];
    if (work && typeof work.tags === "string") work.tags = JSON.parse(work.tags as string);

    return Response.json({ work }, { status: 201 });
  } catch (error) {
    console.error("[works] 新增作品失败:", error);
    return Response.json({ error: "数据库未配置或新增失败" }, { status: 503 });
  }
}
