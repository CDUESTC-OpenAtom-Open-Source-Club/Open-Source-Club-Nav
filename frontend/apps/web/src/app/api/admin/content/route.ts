import { fetchBackend } from "@/lib/backend-proxy";
import { readJson, validateBody } from "@/lib/api-validate";
import { z } from "zod";

const contentPayloadSchema = z.object({ id: z.number().int().positive().optional() }).passthrough();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  return fetchBackend(request, `/api/content${params ? `?${params}` : ""}`);
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const validated = validateBody(contentPayloadSchema, body);
  if (!validated.ok) return validated.response;
  return fetchBackend(request, "/api/content", { body: validated.data });
}

export async function PUT(request: Request) {
  const body = await readJson(request);
  const validated = validateBody(
    contentPayloadSchema.extend({ id: z.number().int().positive() }),
    body,
  );
  if (!validated.ok) return validated.response;
  const { id, ...data } = validated.data;
  return fetchBackend(request, `/api/content/${id}`, { body: data, method: "PUT" });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "缂哄皯 id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/content/${id}`);
}
