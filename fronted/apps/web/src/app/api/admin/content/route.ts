import pool from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { recordAdminActionLog } from "@/lib/admin-logs";

const CATEGORY = "managed_content";
const CONTENT_TYPES = ["resource", "official_news"] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

type ContentRow = {
  id: number;
  title: string;
  description: string;
  url: string;
  sort: number;
  active: number;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
  content_type?: ContentType;
  sub_type?: string;
  body?: string;
};

function unauthorized() {
  return Response.json({ error: "未登录" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

async function requireEditorOrSuper() {
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return { error: unauthorized() as Response, session: null };
  if (session.role !== "editor" && session.role !== "super") {
    return { error: forbidden() as Response, session: null };
  }
  return { error: null, session };
}

function parseContentType(value: unknown): ContentType {
  return CONTENT_TYPES.includes(value as ContentType) ? value as ContentType : "resource";
}

function parseContentPayload(raw: unknown): { content_type: ContentType; sub_type: string; body: string } {
  if (!raw || typeof raw !== "string") {
    return { content_type: "resource", sub_type: "", body: "" };
  }
  try {
    const parsed = JSON.parse(raw) as { contentType?: unknown; content_type?: unknown; subType?: unknown; sub_type?: unknown; body?: unknown };
    return {
      content_type: parseContentType(parsed.contentType || parsed.content_type),
      sub_type: String(parsed.subType || parsed.sub_type || ""),
      body: String(parsed.body || ""),
    };
  } catch {
    return { content_type: "resource", sub_type: "", body: raw };
  }
}

function toContentItems(rows: unknown) {
  return (rows as ContentRow[]).map((row) => {
    const parsed = parseContentPayload(row.content);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      sort: row.sort,
      active: row.active,
      content_type: parsed.content_type,
      sub_type: parsed.sub_type,
      body: parsed.body,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

function buildContentPayload(body: Record<string, unknown>) {
  return JSON.stringify({
    contentType: parseContentType(body.content_type),
    subType: String(body.sub_type || "").trim(),
    body: String(body.body || "").trim(),
  });
}

export async function GET(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const contentType = searchParams.get("content_type");
  const subType = searchParams.get("sub_type");
  const where: string[] = ["category = ?"];
  const values: unknown[] = [CATEGORY];

  if (contentType) {
    where.push("JSON_VALID(content) AND JSON_UNQUOTE(JSON_EXTRACT(content, '$.contentType')) = ?");
    values.push(parseContentType(contentType));
  }
  if (subType) {
    where.push("JSON_VALID(content) AND JSON_UNQUOTE(JSON_EXTRACT(content, '$.subType')) = ?");
    values.push(subType);
  }

  const [rows] = await pool.query(
    `SELECT
       id,
       title,
       link_url AS url,
       description,
       sort,
       active,
       content,
       created_at,
       updated_at
     FROM nav_items
     WHERE ${where.join(" AND ")}
     ORDER BY sort ASC, id ASC`,
    values,
  );

  return Response.json({ contents: toContentItems(rows) });
}

export async function POST(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return Response.json({ error: "标题不能为空" }, { status: 400 });

  const [result] = await pool.query(
    `INSERT INTO nav_items
      (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
     VALUES (?, ?, '', ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      title,
      buildContentPayload(body),
      String(body.url || "").trim(),
      String(body.description || "").trim(),
      Number(body.sort || 0),
      body.active === 0 ? 0 : 1,
      CATEGORY,
    ],
  );
  const id = (result as { insertId: number }).insertId;
  await recordAdminActionLog({
    actor: auth.session,
    action: "create_content",
    navItemId: id,
    detail: { id, title, content_type: parseContentType(body.content_type), sub_type: body.sub_type || "" },
  });

  return Response.json({ ok: true, id }, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

  await pool.query(
    `UPDATE nav_items
     SET title = ?, content = ?, link_url = ?, description = ?, sort = ?, active = ?, updated_at = NOW(3)
     WHERE id = ? AND category = ?`,
    [
      String(body.title || "").trim(),
      buildContentPayload(body),
      String(body.url || "").trim(),
      String(body.description || "").trim(),
      Number(body.sort || 0),
      body.active === 0 ? 0 : 1,
      id,
      CATEGORY,
    ],
  );
  await recordAdminActionLog({
    actor: auth.session,
    action: "update_content",
    navItemId: id,
    detail: { id, title: body.title, content_type: parseContentType(body.content_type), sub_type: body.sub_type || "" },
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

  await pool.query("DELETE FROM nav_items WHERE id = ? AND category = ?", [id, CATEGORY]);
  await recordAdminActionLog({
    actor: auth.session,
    action: "delete_content",
    navItemId: id,
    detail: { id },
  });
  return Response.json({ ok: true });
}
