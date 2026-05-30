// 友情链接接口。
// GET：返回启用中的友情链接。
// POST/PUT/DELETE：需 editor+ 权限。

import { getLinks, createLink, updateLink, deleteLink } from "@/services/links";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import type { NavModule, ResourceMatrixSubModule } from "@/types/links";

const MODULES: NavModule[] = ["resource_matrix", "friend_links", "mini_games"];
const RESOURCE_SUB_MODULES: ResourceMatrixSubModule[] = ["think_tank", "campus", "tools"];
const DEFAULT_MODULE: NavModule = "friend_links";

function parseModule(value: unknown): NavModule {
  return MODULES.includes(value as NavModule) ? (value as NavModule) : DEFAULT_MODULE;
}

function parseResourceSubModule(value: unknown): ResourceMatrixSubModule | undefined {
  return RESOURCE_SUB_MODULES.includes(value as ResourceMatrixSubModule)
    ? (value as ResourceMatrixSubModule)
    : undefined;
}

async function requireEditorOrSuper() {
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });
  if (session.role !== "editor" && session.role !== "super") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const navModule = parseModule(searchParams.get("module"));
  const resourceSubModule = navModule === "resource_matrix"
    ? parseResourceSubModule(searchParams.get("resource_sub_module"))
    : undefined;

  const result = await getLinks(navModule, resourceSubModule);
  return Response.json({
    ...result,
    module: navModule,
    resource_sub_module: resourceSubModule || null,
  });
}

export async function POST(request: Request) {
  const denied = await requireEditorOrSuper();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.title || !body.url) {
      return Response.json({ error: "title 和 url 为必填项" }, { status: 400 });
    }
    const link = await createLink({ ...body, module: "friend_links" });
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
    if (!body.id) return Response.json({ error: "id 为必填项" }, { status: 400 });
    const link = await updateLink({ ...body, module: "friend_links" });
    if (!link) return Response.json({ error: "友链不存在" }, { status: 404 });
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
    if (!id) return Response.json({ error: "id 为必填项" }, { status: 400 });
    await deleteLink(id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "数据库未配置，无法删除友链" }, { status: 503 });
  }
}
