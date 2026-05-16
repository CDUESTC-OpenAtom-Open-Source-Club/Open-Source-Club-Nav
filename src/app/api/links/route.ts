import pool from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

interface FriendLink {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
  active: number;
  created_at: string;
  updated_at: string;
}

async function requireEditorOrSuper() {
  // 前台 links 接口的写操作也复用后台登录权限。
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }
  if (session.role !== "editor" && session.role !== "super") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }
  return null;
}

// 数据库不可用时，前台仍可展示这组默认友链。
const FALLBACK_LINKS: FriendLink[] = [
  {
    id: 1,
    title: "Cooo Wiki 友链页",
    url: "https://wiki.cooo.site/links",
    description: "Cooo Wiki 友情链接",
    sort: 1,
    active: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "HDU CS Wiki",
    url: "https://hdu-cs.wiki/",
    description: "杭电计算机知识库",
    sort: 2,
    active: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

export async function GET() {
  // mock 模式下直接返回默认友链。
  if (USE_MOCK) {
    return Response.json({ links: FALLBACK_LINKS, source: "mock" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM friend_links WHERE active = 1 ORDER BY sort ASC, id ASC"
    );
    return Response.json({ links: rows, source: "mysql" });
  } catch {
    console.warn("[links] MySQL 不可用，返回默认数据");
    return Response.json({ links: FALLBACK_LINKS, source: "fallback" });
  }
}

export async function POST(request: Request) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { title, url, description, sort } = body;

    if (!title || !url) {
      return Response.json({ error: "title 和 url 为必填项" }, { status: 400 });
    }

    const [result] = await pool.query(
      "INSERT INTO friend_links (title, url, description, sort, active) VALUES (?, ?, ?, ?, 1)",
      [title, url, description || "", sort ?? 0]
    );

    const insertId = (result as { insertId: number }).insertId;
    const [rows] = await pool.query("SELECT * FROM friend_links WHERE id = ?", [insertId]);
    const link = (rows as FriendLink[])[0];

    return Response.json({ link }, { status: 201 });
  } catch {
    return Response.json({ error: "数据库未配置，无法新增友链" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { id, title, url, description, sort, active } = body;

    if (!id) {
      return Response.json({ error: "id 为必填项" }, { status: 400 });
    }

    // 仅更新传入字段，避免把前端未编辑的值覆盖为空。
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (title !== undefined) { fields.push("title = ?"); values.push(title); }
    if (url !== undefined) { fields.push("url = ?"); values.push(url); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (sort !== undefined) { fields.push("sort = ?"); values.push(sort); }
    if (active !== undefined) { fields.push("active = ?"); values.push(active ? 1 : 0); }

    if (fields.length === 0) {
      return Response.json({ error: "没有可更新字段" }, { status: 400 });
    }

    values.push(id);
    await pool.query(`UPDATE friend_links SET ${fields.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.query("SELECT * FROM friend_links WHERE id = ?", [id]);
    const link = (rows as FriendLink[])[0];

    if (!link) {
      return Response.json({ error: "友链不存在" }, { status: 404 });
    }

    return Response.json({ link });
  } catch {
    return Response.json({ error: "数据库未配置，无法更新友链" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return Response.json({ error: "id 为必填项" }, { status: 400 });
    }

    // 这里保留软删除，后台可恢复或继续审计历史数据。
    const [result] = await pool.query(
      "UPDATE friend_links SET active = 0 WHERE id = ?",
      [id]
    );

    const affected = (result as { affectedRows: number }).affectedRows;
    if (affected === 0) {
      return Response.json({ error: "友链不存在" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "数据库未配置，无法删除友链" }, { status: 503 });
  }
}
