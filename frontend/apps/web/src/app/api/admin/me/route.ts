import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const resp = await fetchBackend(request, "/api/admin/me");
  if (!resp.ok) return resp;

  try {
    const raw = await resp.json();
    const source = raw.user ?? raw;
    const user = {
      id: source.userId ?? source.id,
      username: source.username,
      role: source.role,
    };
    return Response.json({ user });
  } catch {
    return Response.json({ error: "鐟欙絾鐎介悽銊﹀煕娣団剝浼呮径杈Е" }, { status: 500 });
  }
}
