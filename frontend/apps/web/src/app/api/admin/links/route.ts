// @route-desc BFF API route proxy/handler for /api/admin/links/route.ts
import { fetchBackend } from "@/lib/backend-proxy";
import { readJson, validateBody } from "@/lib/api-validate";
import { z } from "zod";

const upsertLinkSchema = z.object({ id: z.number().int().positive().optional() }).passthrough();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/links${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const validated = validateBody(upsertLinkSchema, body);
  if (!validated.ok) return validated.response;
  return fetchBackend(request, "/api/admin/links", { body: validated.data });
}

export async function PUT(request: Request) {
  const body = await readJson(request);
  const validated = validateBody(
    upsertLinkSchema.extend({ id: z.number().int().positive() }),
    body,
  );
  if (!validated.ok) return validated.response;
  return fetchBackend(request, `/api/admin/links/${validated.data.id}`, {
    body: validated.data,
    method: "PUT",
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缺少 id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/admin/links/${id}`, { method: "DELETE" });
}
