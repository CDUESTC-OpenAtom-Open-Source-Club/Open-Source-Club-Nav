import pool from "@/lib/db";
import { FALLBACK_LINKS } from "@/data/mock/links";
import type { FriendLink, LinkCreateInput, LinkUpdateInput, NavModule } from "@/types/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const DEFAULT_MODULE: NavModule = "friend_links";
const MODULES: NavModule[] = ["resource_matrix", "friend_links", "mini_games"];

function normalizeModule(value: unknown): NavModule {
  return MODULES.includes(value as NavModule) ? (value as NavModule) : DEFAULT_MODULE;
}

function buildModuleWhereClause(navModule?: NavModule): { sql: string; values: unknown[] } {
  if (!navModule) return { sql: "", values: [] };
  if (navModule === "friend_links") {
    // Backward compatibility: legacy rows may have null/empty category.
    return { sql: "AND (category = ? OR category IS NULL OR category = '')", values: [navModule] };
  }
  return { sql: "AND category = ?", values: [navModule] };
}

function toFriendLinks(rows: unknown): FriendLink[] {
  return (rows as FriendLink[]).map((item) => ({
    ...item,
    module: normalizeModule((item as FriendLink).module),
  }));
}

export async function getLinks(navModule: NavModule = DEFAULT_MODULE): Promise<{ links: FriendLink[]; source: string }> {
  if (USE_MOCK) {
    const links = FALLBACK_LINKS.filter((item) => normalizeModule(item.module) === navModule);
    return { links, source: "mock" };
  }

  try {
    const where = buildModuleWhereClause(navModule);
    const [rows] = await pool.query(
      `SELECT
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
         created_at,
         updated_at
       FROM nav_items
       WHERE active = 1
         ${where.sql}
       ORDER BY sort ASC, id ASC`,
      where.values,
    );
    return { links: toFriendLinks(rows), source: "mysql" };
  } catch {
    const links = FALLBACK_LINKS.filter((item) => normalizeModule(item.module) === navModule);
    return { links, source: "fallback" };
  }
}

export async function getAllLinks(navModule?: NavModule): Promise<FriendLink[]> {
  if (USE_MOCK) {
    const { MOCK_ADMIN_LINKS } = await import("@/data/mock/links");
    const full = MOCK_ADMIN_LINKS as FriendLink[];
    return navModule ? full.filter((item) => normalizeModule(item.module) === navModule) : full;
  }

  const where = buildModuleWhereClause(navModule);
  const [rows] = await pool.query(
    `SELECT
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
       created_at,
       updated_at
     FROM nav_items
     WHERE 1 = 1
       ${where.sql}
     ORDER BY sort ASC, id ASC`,
    where.values,
  );
  return toFriendLinks(rows);
}

export async function createLink(input: LinkCreateInput): Promise<FriendLink> {
  const navModule = normalizeModule(input.module);
  const [result] = await pool.query(
    `INSERT INTO nav_items
      (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
     VALUES (?, ?, '', ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      input.title,
      input.description || "",
      input.url,
      input.description || "",
      input.sort || 0,
      input.active ?? 1,
      navModule,
    ],
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query(
    `SELECT
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
       created_at,
       updated_at
     FROM nav_items
     WHERE id = ?`,
    [insertId],
  );
  return toFriendLinks(rows)[0];
}

export async function updateLink(input: LinkUpdateInput): Promise<FriendLink | null> {
  const allowed = ["title", "url", "description", "sort", "active", "module"] as const;
  const fields: string[] = [];
  const values: (string | number)[] = [];

  for (const key of allowed) {
    if (input[key] !== undefined) {
      if (key === "url") {
        fields.push("link_url = ?");
        values.push(input[key] as string | number);
      } else if (key === "module") {
        fields.push("category = ?");
        values.push(normalizeModule(input[key]));
      } else {
        fields.push(`${key} = ?`);
        values.push(input[key] as string | number);
      }
    }
  }
  if (fields.length === 0) return null;

  values.push(input.id);
  await pool.query(`UPDATE nav_items SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ?`, values);
  const [rows] = await pool.query(
    `SELECT
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
       created_at,
       updated_at
     FROM nav_items
     WHERE id = ?`,
    [input.id],
  );
  return toFriendLinks(rows)[0] || null;
}

export async function deleteLink(id: number): Promise<void> {
  await pool.query("UPDATE nav_items SET active = 0, updated_at = NOW(3) WHERE id = ?", [id]);
}
