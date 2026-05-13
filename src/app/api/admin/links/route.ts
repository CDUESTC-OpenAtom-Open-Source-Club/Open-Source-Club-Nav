import pool from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";

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

async function writeLinkLog(
  session: { userId: number; username: string; role: "super" | "editor" },
  action: string,
  linkId: number | null,
  detail: Record<string, unknown>,
) {
  await pool.query(
    `INSERT INTO admin_link_logs
      (link_id, action, actor_user_id, actor_username, actor_role, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      linkId,
      action,
      session.userId,
      session.username,
      session.role,
      JSON.stringify(detail || {}),
    ],
  );
}

export async function GET() {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;
  const [rows] = await pool.query("SELECT * FROM friend_links ORDER BY sort ASC, id ASC");
  return Response.json({ links: rows });
}

export async function POST(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const title = String(body?.title || "").trim();
    const url = String(body?.url || "").trim();
    const description = String(body?.description || "").trim();
    const sort = Number(body?.sort || 0);

    if (!title || !url) {
      return Response.json({ error: "标题和链接不能为空" }, { status: 400 });
    }
    const [result] = await pool.query(
      "INSERT INTO friend_links (title, url, description, sort, active) VALUES (?, ?, ?, ?, 1)",
      [title, url, description, Number.isFinite(sort) ? sort : 0],
    );
    const linkId = Number((result as { insertId?: number }).insertId || 0) || null;
    await writeLinkLog(auth.session!, "create", linkId, { title, url, description, sort });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "新增链接失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

    const fields: string[] = [];
    const values: Array<string | number> = [];
    if (body?.title !== undefined) {
      fields.push("title = ?");
      values.push(String(body.title));
    }
    if (body?.url !== undefined) {
      fields.push("url = ?");
      values.push(String(body.url));
    }
    if (body?.description !== undefined) {
      fields.push("description = ?");
      values.push(String(body.description));
    }
    if (body?.sort !== undefined) {
      fields.push("sort = ?");
      values.push(Number(body.sort) || 0);
    }
    if (body?.active !== undefined) {
      fields.push("active = ?");
      values.push(body.active ? 1 : 0);
    }

    if (fields.length === 0) {
      return Response.json({ error: "无更新字段" }, { status: 400 });
    }

    values.push(id);
    await pool.query(`UPDATE friend_links SET ${fields.join(", ")} WHERE id = ?`, values);
    await writeLinkLog(auth.session!, "update", id, {
      title: body?.title,
      url: body?.url,
      description: body?.description,
      sort: body?.sort,
      active: body?.active,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "更新链接失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireEditorOrSuper();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

  await pool.query("UPDATE friend_links SET active = 0 WHERE id = ?", [id]);
  await writeLinkLog(auth.session!, "disable", id, {});
  return Response.json({ ok: true });
}
