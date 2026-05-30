import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { recordAdminActionLog } from "@/lib/admin-logs";
import { MOCK_ADMIN_LINKS } from "@/data/mock/links";
import { getAllLinks, createLink, updateLink, deleteLink, getLinkById } from "@/services/links";
import type { NavModule, ResourceMatrixSubModule } from "@/types/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const MODULES: NavModule[] = ["resource_matrix", "friend_links", "mini_games"];
const RESOURCE_SUB_MODULES: ResourceMatrixSubModule[] = ["think_tank", "campus", "tools"];
const DEFAULT_MODULE: NavModule = "friend_links";

function unauthorized() {
  return Response.json({ error: "未登录" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

function parseModule(value: unknown): NavModule {
  return MODULES.includes(value as NavModule) ? (value as NavModule) : DEFAULT_MODULE;
}

function parseResourceSubModule(value: unknown): ResourceMatrixSubModule | undefined {
  return RESOURCE_SUB_MODULES.includes(value as ResourceMatrixSubModule)
    ? (value as ResourceMatrixSubModule)
    : undefined;
}

async function requireEditorOrSuper() {
  if (USE_MOCK) {
    return {
      error: null,
      session: { userId: 1, username: "admin", role: "super" as const },
    };
  }

  try {
    await ensureAdminTables();
    const session = await getAdminSessionFromCookies();
    if (!session) return { error: unauthorized() as Response, session: null };
    if (session.role !== "editor" && session.role !== "super") {
      return { error: forbidden() as Response, session: null };
    }
    return { error: null, session };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] 权限检查使用 mock 回退：", (error as Error)?.message || error);
      return {
        error: null,
        session: { userId: 1, username: "admin", role: "super" as const },
      };
    }
    throw error;
  }
}

function buildLinkSnapshot(link: Awaited<ReturnType<typeof getLinkById>>) {
  if (!link) return null;
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description,
    sort: link.sort,
    active: link.active,
    module: link.module,
    resource_sub_module: link.resource_sub_module,
    click_count: link.click_count,
    created_at: link.created_at,
    updated_at: link.updated_at,
  };
}

function getChangedFields(
  before: ReturnType<typeof buildLinkSnapshot>,
  after: ReturnType<typeof buildLinkSnapshot>,
) {
  if (!before || !after) return [];
  const keys = Object.keys(after) as Array<keyof NonNullable<ReturnType<typeof buildLinkSnapshot>>>;
  return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const navModule = parseModule(searchParams.get("module"));
  const resourceSubModule = navModule === "resource_matrix"
    ? parseResourceSubModule(searchParams.get("resource_sub_module"))
    : undefined;

  try {
    if (USE_MOCK) {
      const links = MOCK_ADMIN_LINKS.filter((item) => {
        if (parseModule((item as { module?: string }).module) !== navModule) return false;
        if (navModule !== "resource_matrix" || !resourceSubModule) return true;
        return parseResourceSubModule((item as { resource_sub_module?: string }).resource_sub_module) === resourceSubModule;
      });
      return Response.json({ links, module: navModule, resource_sub_module: resourceSubModule || null });
    }

    const auth = await requireEditorOrSuper();
    if (auth.error) return auth.error;

    const links = await getAllLinks(navModule, resourceSubModule);
    return Response.json({ links, module: navModule, resource_sub_module: resourceSubModule || null });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const links = MOCK_ADMIN_LINKS.filter((item) => {
        if (parseModule((item as { module?: string }).module) !== navModule) return false;
        if (navModule !== "resource_matrix" || !resourceSubModule) return true;
        return parseResourceSubModule((item as { resource_sub_module?: string }).resource_sub_module) === resourceSubModule;
      });
      console.warn("[admin/links] GET 使用 mock 回退：", (error as Error)?.message || error);
      return Response.json({ links, module: navModule, resource_sub_module: resourceSubModule || null });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => ({}));
  try {
    const body = requestBody;
    const navModule = parseModule(body?.module);
    const resourceSubModule = navModule === "resource_matrix"
      ? (parseResourceSubModule(body?.resource_sub_module) || "think_tank")
      : undefined;
    if (USE_MOCK) {
      return Response.json({
        ok: true,
        link: {
          id: Date.now(),
          title: String(body?.title || ""),
          url: String(body?.url || ""),
          description: String(body?.description || ""),
          sort: Number(body?.sort || 0),
          active: 1,
          module: navModule,
          resource_sub_module: resourceSubModule,
          click_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }, { status: 201 });
    }

    const auth = await requireEditorOrSuper();
    if (auth.error) return auth.error;

    const title = String(body?.title || "").trim();
    const url = String(body?.url || "").trim();
    const description = String(body?.description || "").trim();
    const sort = Number(body?.sort || 0);

    if (!title || !url) {
      return Response.json({ error: "标题和链接不能为空" }, { status: 400 });
    }

    const link = await createLink({ title, url, description, sort, module: navModule, resource_sub_module: resourceSubModule });
    await recordAdminActionLog({
      actor: auth.session,
      action: "create_link",
      navItemId: link.id,
      detail: {
        input: { title, url, description, sort, module: navModule, resource_sub_module: resourceSubModule },
        created: buildLinkSnapshot(link),
      },
    });
    return Response.json({ ok: true, link }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] POST 使用 mock 回退：", (error as Error)?.message || error);
      const body = requestBody;
      const navModule = parseModule(body?.module);
      const resourceSubModule = navModule === "resource_matrix"
        ? (parseResourceSubModule(body?.resource_sub_module) || "think_tank")
        : undefined;
      return Response.json({
        ok: true,
        link: {
          id: Date.now(),
          title: String(body?.title || ""),
          url: String(body?.url || ""),
          description: String(body?.description || ""),
          sort: Number(body?.sort || 0),
          active: 1,
          module: navModule,
          resource_sub_module: resourceSubModule,
          click_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }, { status: 201 });
    }
    return Response.json({ error: "新增链接失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (USE_MOCK) {
    const body = await request.json().catch(() => ({}));
    return Response.json({ ok: true, link: body });
  }

  const requestBody = await request.json().catch(() => ({}));
  try {
    const body = requestBody;
    const auth = await requireEditorOrSuper();
    if (auth.error) return auth.error;
    const id = Number(body?.id);
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });
    const before = buildLinkSnapshot(await getLinkById(id));

    const navModule = body?.module === undefined ? undefined : parseModule(body?.module);
    const resourceSubModule = body?.resource_sub_module === undefined
      ? undefined
      : parseResourceSubModule(body?.resource_sub_module);
    const link = await updateLink({
      id,
      title: body?.title,
      url: body?.url,
      description: body?.description,
      sort: body?.sort,
      active: body?.active,
      module: navModule,
      resource_sub_module: resourceSubModule,
    });
    if (!link) return Response.json({ error: "没有可更新字段" }, { status: 400 });
    const after = buildLinkSnapshot(link);
    const changedFields = getChangedFields(before, after);
    const action = body?.active === 0 ? "disable_link" : body?.active === 1 ? "enable_link" : "update_link";

    await recordAdminActionLog({
      actor: auth.session,
      action,
      navItemId: id,
      detail: {
        request: {
          title: body?.title,
          url: body?.url,
          description: body?.description,
          sort: body?.sort,
          active: body?.active,
          module: navModule,
          resource_sub_module: resourceSubModule,
        },
        changed_fields: changedFields,
        before,
        after,
      },
    });
    return Response.json({ ok: true, link });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] PUT 使用 mock 回退：", (error as Error)?.message || error);
      return Response.json({ ok: true, link: requestBody });
    }
    return Response.json({ error: "更新链接失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (USE_MOCK) {
    return Response.json({ ok: true });
  }

  try {
    const auth = await requireEditorOrSuper();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });
    const before = buildLinkSnapshot(await getLinkById(id));

    await deleteLink(id);
    const after = buildLinkSnapshot(await getLinkById(id));
    await recordAdminActionLog({
      actor: auth.session,
      action: "delete_link",
      navItemId: id,
      detail: {
        changed_fields: getChangedFields(before, after),
        before,
        after,
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/links] DELETE 使用 mock 回退：", (error as Error)?.message || error);
      return Response.json({ ok: true });
    }
    throw error;
  }
}
