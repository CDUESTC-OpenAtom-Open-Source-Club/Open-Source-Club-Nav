import { fetchBackend } from "@/lib/backend-proxy";
import { readJson, validateBody } from "@/lib/api-validate";
import { z } from "zod";

const createAdminUserSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(6, "password must be at least 6 characters"),
  role: z.enum(["super", "editor"]),
  email: z.string().email().optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
});

export async function GET(request: Request) {
  return fetchBackend(request, "/api/admin/users");
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const validated = validateBody(createAdminUserSchema, body);
  if (!validated.ok) return validated.response;
  return fetchBackend(request, "/api/admin/users", { body: validated.data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "missing id" }, { status: 400 });
  }
  return fetchBackend(request, `/api/admin/users/${id}`);
}
