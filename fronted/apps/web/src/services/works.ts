import pool from "@/lib/db";
import { FALLBACK_WORKS } from "@/data/mock/works";
import type { Work, WorkCreateInput, WorkUpdateInput } from "@/types/works";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const GITHUB_ORG = "CDUESTC-OpenAtom-Open-Source-Club";
const COLORS = ["#0A84FF", "#06E5CC", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#38BDF8", "#EC4899"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRepo(repo: any, index: number): Work {
  const owner = repo.owner?.login || GITHUB_ORG;
  return {
    id: index + 1,
    type: "GITHUB",
    repo_url: repo.html_url,
    title: repo.name || "untitled",
    description: repo.description || "",
    author_name: owner,
    author_avatar: owner.slice(0, 2).toUpperCase(),
    tags: repo.language ? [repo.language] : [],
    color: COLORS[index % COLORS.length],
    status: repo.archived ? "已归档" : "开发中",
    stars: repo.stargazers_count || 0,
    preview_url: repo.homepage || null,
    is_featured: 1,
    display_order: index + 1,
  };
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function fetchGitHubWorks(): Promise<Work[]> {
  const res = await fetch(
    `https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&sort=updated`,
    { headers: ghHeaders(), next: { revalidate: 120 } }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const repos = await res.json() as Record<string, unknown>[];
  return repos.filter((r) => !r.fork).map((r, i) => transformRepo(r, i));
}

async function fetchDBWorks(): Promise<Work[]> {
  const [rows] = await pool.query("SELECT * FROM works WHERE is_featured = 1 ORDER BY display_order ASC");
  return rowsToWorks(rows);
}

function rowsToWorks(rows: unknown): Work[] {
  return (rows as Record<string, unknown>[]).map((row) => ({
    ...row,
    tags: parseTags(row.tags),
  })) as Work[];
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export async function getWorks(): Promise<{ works: Work[]; source: string }> {
  if (USE_MOCK) return { works: FALLBACK_WORKS, source: "mock" };

  try {
    const works = await fetchDBWorks();
    if (works.length > 0) return { works, source: "mysql" };
  } catch {
    console.warn("[works] MySQL 不可用，尝试 GitHub 数据源");
  }

  try {
    const works = await fetchGitHubWorks();
    return { works, source: "github" };
  } catch (err) {
    console.warn("[works] GitHub API 不可用，返回静态数据:", (err as Error).message);
  }

  return { works: FALLBACK_WORKS, source: "fallback" };
}

export async function getAllWorks(): Promise<Work[]> {
  if (USE_MOCK) return FALLBACK_WORKS;
  const [rows] = await pool.query("SELECT * FROM works ORDER BY display_order ASC, id ASC");
  return rowsToWorks(rows);
}

export async function createWork(input: WorkCreateInput): Promise<Work> {
  let { title, description = "", stars = 0, tags = [], author_avatar } = input;
  const author_name = input.author_name!;

  if (!author_avatar) author_avatar = author_name.slice(0, 2).toUpperCase();

  if (input.type === "GITHUB" && input.repo_url) {
    const match = input.repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, owner, repo] = match;
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() });
        if (ghRes.ok) {
          const ghData = await ghRes.json() as Record<string, unknown>;
          title = title || (ghData.name as string);
          description = description || (ghData.description as string) || "";
          stars = (ghData.stargazers_count as number) || 0;
          const langs = ghData.language ? [ghData.language as string] : [];
          tags = tags.length ? tags : langs;
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
      input.type || "MANUAL", input.repo_url || null, title, description, author_name,
      author_avatar, JSON.stringify(tags), input.color || "#0A84FF", input.status || "开发中",
      stars, input.preview_url || null, input.is_featured !== false ? 1 : 0, input.display_order || 0,
    ]
  );

  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query("SELECT * FROM works WHERE id = ?", [insertId]);
  return rowsToWorks(rows)[0];
}

export async function updateWork(id: number, input: WorkUpdateInput): Promise<Work | null> {
  const allowedFields = [
    "type", "repo_url", "title", "description", "author_name", "author_avatar",
    "tags", "color", "status", "stars", "preview_url", "is_featured", "display_order",
  ] as const;
  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  const source = input as Record<string, unknown>;

  for (const key of allowedFields) {
    if (source[key] === undefined) continue;
    fields.push(`${key} = ?`);
    if (key === "tags") {
      values.push(JSON.stringify(parseTags(source[key])));
    } else if (key === "is_featured") {
      values.push(source[key] ? 1 : 0);
    } else if (source[key] === "") {
      values.push(key === "repo_url" || key === "preview_url" ? null : "");
    } else {
      values.push(source[key] as string | number | null);
    }
  }

  if (fields.length === 0) return null;
  values.push(id);
  await pool.query(`UPDATE works SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`, values);
  const [rows] = await pool.query("SELECT * FROM works WHERE id = ?", [id]);
  return rowsToWorks(rows)[0] || null;
}

export async function deleteWork(id: number): Promise<boolean> {
  const [result] = await pool.query("DELETE FROM works WHERE id = ?", [id]);
  return Boolean((result as { affectedRows?: number }).affectedRows);
}
