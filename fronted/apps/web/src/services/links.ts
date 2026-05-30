import pool from "@/lib/db";
import { FALLBACK_LINKS } from "@/data/mock/links";
import type { FriendLink, LinkCreateInput, LinkUpdateInput, NavModule, ResourceMatrixSubModule, GameType } from "@/types/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const DEFAULT_MODULE: NavModule = "friend_links";
const MODULES: NavModule[] = ["resource_matrix", "friend_links", "mini_games"];
const RESOURCE_SUB_MODULES: ResourceMatrixSubModule[] = ["think_tank", "campus", "tools"];
const DEFAULT_RESOURCE_SUB_MODULE: ResourceMatrixSubModule = "think_tank";

const LINK_SELECT_FIELDS = `
  id,
  title,
  link_url AS url,
  description,
  sort,
  active,
  CASE
    WHEN category IS NULL OR category = '' THEN '${DEFAULT_MODULE}'
    ELSE category
  END AS module,
  game_type,
  COALESCE(mc.click_count, 0) AS click_count,
  content,
  created_at,
  updated_at
`;
const METRICS_CLICK_JOIN = `
  LEFT JOIN (
    SELECT nav_item_id, COUNT(*) AS click_count
    FROM metrics
    WHERE event_type = 'click'
    GROUP BY nav_item_id
  ) mc ON mc.nav_item_id = nav_items.id
`;

type DbLinkRow = FriendLink & {
  module?: NavModule;
  content?: string | null;
  click_count?: number;
  game_type?: string | null;
};

function normalizeModule(value: unknown): NavModule {
  return MODULES.includes(value as NavModule) ? (value as NavModule) : DEFAULT_MODULE;
}

function normalizeResourceSubModule(value: unknown): ResourceMatrixSubModule {
  return RESOURCE_SUB_MODULES.includes(value as ResourceMatrixSubModule)
    ? (value as ResourceMatrixSubModule)
    : DEFAULT_RESOURCE_SUB_MODULE;
}

function extractResourceSubModule(content: unknown): ResourceMatrixSubModule | undefined {
  if (!content || typeof content !== "string") return undefined;
  try {
    const parsed = JSON.parse(content) as { resourceSubModule?: unknown } | null;
    if (!parsed || typeof parsed !== "object") return undefined;
    if (!parsed.resourceSubModule) return undefined;
    return normalizeResourceSubModule(parsed.resourceSubModule);
  } catch {
    return undefined;
  }
}

function getResourceSubModule(item: DbLinkRow, navModule: NavModule): ResourceMatrixSubModule | undefined {
  if (navModule !== "resource_matrix") return undefined;
  const fromField = (item as { resource_sub_module?: unknown }).resource_sub_module;
  if (fromField) return normalizeResourceSubModule(fromField);
  return extractResourceSubModule(item.content);
}

function buildModuleWhereClause(navModule?: NavModule): { sql: string; values: unknown[] } {
  if (!navModule) return { sql: "", values: [] };
  if (navModule === "friend_links") {
    // Backward compatibility: legacy rows may have null/empty category.
    return { sql: "AND (category = ? OR category IS NULL OR category = '')", values: [navModule] };
  }
  return { sql: "AND category = ?", values: [navModule] };
}

function buildResourceSubModuleWhereClause(resourceSubModule?: ResourceMatrixSubModule): { sql: string; values: unknown[] } {
  if (!resourceSubModule) return { sql: "", values: [] };
  return {
    sql: "AND JSON_VALID(content) AND JSON_UNQUOTE(JSON_EXTRACT(content, '$.resourceSubModule')) = ?",
    values: [resourceSubModule],
  };
}

function buildContentPayload(navModule: NavModule, resourceSubModule?: ResourceMatrixSubModule): string {
  if (navModule !== "resource_matrix") return "";
  return JSON.stringify({
    resourceSubModule: normalizeResourceSubModule(resourceSubModule),
  });
}

function toFriendLinks(rows: unknown): FriendLink[] {
  return (rows as DbLinkRow[]).map((item) => {
    const normalizedModule = normalizeModule(item.module);
    const resourceSubModule = getResourceSubModule(item, normalizedModule);
    const gameType = (item.game_type === "internal" || item.game_type === "external")
      ? item.game_type
      : undefined;
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      description: item.description,
      sort: item.sort,
      active: item.active,
      module: normalizedModule,
      resource_sub_module: resourceSubModule,
      game_type: gameType ?? null,
      click_count: Number(item.click_count || 0),
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });
}

export async function getLinks(
  navModule: NavModule = DEFAULT_MODULE,
  resourceSubModule?: ResourceMatrixSubModule,
): Promise<{ links: FriendLink[]; source: string }> {
  if (USE_MOCK) {
    const links = FALLBACK_LINKS.filter((item) => {
      const normalizedModule = normalizeModule(item.module);
      if (normalizedModule !== navModule) return false;
      if (navModule !== "resource_matrix" || !resourceSubModule) return true;
      return normalizeResourceSubModule(item.resource_sub_module) === resourceSubModule;
    });
    return { links, source: "mock" };
  }

  try {
    const where = buildModuleWhereClause(navModule);
    const subWhere = navModule === "resource_matrix"
      ? buildResourceSubModuleWhereClause(resourceSubModule)
      : { sql: "", values: [] };
    const [rows] = await pool.query(
      `SELECT
         ${LINK_SELECT_FIELDS}
       FROM nav_items
       ${METRICS_CLICK_JOIN}
       WHERE active = 1
         ${where.sql}
         ${subWhere.sql}
       ORDER BY sort ASC, id ASC`,
      [...where.values, ...subWhere.values],
    );
    return { links: toFriendLinks(rows), source: "mysql" };
  } catch {
    const links = FALLBACK_LINKS.filter((item) => {
      const normalizedModule = normalizeModule(item.module);
      if (normalizedModule !== navModule) return false;
      if (navModule !== "resource_matrix" || !resourceSubModule) return true;
      return normalizeResourceSubModule(item.resource_sub_module) === resourceSubModule;
    });
    return { links, source: "fallback" };
  }
}

export async function getAllLinks(navModule?: NavModule, resourceSubModule?: ResourceMatrixSubModule): Promise<FriendLink[]> {
  if (USE_MOCK) {
    const { MOCK_ADMIN_LINKS } = await import("@/data/mock/links");
    const full = MOCK_ADMIN_LINKS as FriendLink[];
    return full.filter((item) => {
      const normalizedModule = normalizeModule(item.module);
      if (navModule && normalizedModule !== navModule) return false;
      if (navModule === "resource_matrix" && resourceSubModule) {
        return normalizeResourceSubModule(item.resource_sub_module) === resourceSubModule;
      }
      return true;
    });
  }

  const where = buildModuleWhereClause(navModule);
  const subWhere = navModule === "resource_matrix"
    ? buildResourceSubModuleWhereClause(resourceSubModule)
    : { sql: "", values: [] };
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE 1 = 1
       ${where.sql}
       ${subWhere.sql}
     ORDER BY sort ASC, id ASC`,
    [...where.values, ...subWhere.values],
  );
  return toFriendLinks(rows);
}

export async function getLinkById(id: number): Promise<FriendLink | null> {
  if (!id) return null;
  if (USE_MOCK) {
    const { MOCK_ADMIN_LINKS } = await import("@/data/mock/links");
    return ((MOCK_ADMIN_LINKS as FriendLink[]).find((item) => Number(item.id) === Number(id)) || null);
  }
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return toFriendLinks(rows)[0] || null;
}

export async function createLink(input: LinkCreateInput): Promise<FriendLink> {
  const navModule = normalizeModule(input.module);
  const gameType = navModule === "mini_games" ? (input.game_type || "internal") : null;
  const [result] = await pool.query(
    `INSERT INTO nav_items
      (title, content, cover_url, link_url, description, sort, active, category, game_type, created_at, updated_at)
     VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      input.title,
      buildContentPayload(navModule, input.resource_sub_module),
      input.url,
      input.description || "",
      input.sort || 0,
      input.active ?? 1,
      navModule,
      gameType,
    ],
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE id = ?`,
    [insertId],
  );
  return toFriendLinks(rows)[0];
}

export async function updateLink(input: LinkUpdateInput): Promise<FriendLink | null> {
  const currentModule = input.module === undefined ? undefined : normalizeModule(input.module);
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (input.title !== undefined) {
    fields.push("title = ?");
    values.push(input.title);
  }
  if (input.url !== undefined) {
    fields.push("link_url = ?");
    values.push(input.url);
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    values.push(input.description);
  }
  if (input.sort !== undefined) {
    fields.push("sort = ?");
    values.push(input.sort);
  }
  if (input.active !== undefined) {
    fields.push("active = ?");
    values.push(input.active);
  }
  if (currentModule !== undefined) {
    fields.push("category = ?");
    values.push(currentModule);
  }
  if (input.resource_sub_module !== undefined || currentModule !== undefined) {
    const moduleForContent = currentModule ?? "resource_matrix";
    fields.push("content = ?");
    values.push(buildContentPayload(moduleForContent, input.resource_sub_module));
  }
  if (input.game_type !== undefined) {
    fields.push("game_type = ?");
    values.push(input.game_type || null);
  }
  if (fields.length === 0) return null;

  values.push(input.id);
  await pool.query(`UPDATE nav_items SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ?`, values);
  const [rows] = await pool.query(
    `SELECT
       ${LINK_SELECT_FIELDS}
     FROM nav_items
     ${METRICS_CLICK_JOIN}
     WHERE id = ?`,
    [input.id],
  );
  return toFriendLinks(rows)[0] || null;
}

export async function deleteLink(id: number): Promise<void> {
  await pool.query("DELETE FROM nav_items WHERE id = ?", [id]);
}
