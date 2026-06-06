import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const resp = await fetchBackend(request, "/api/admin/me");
  if (!resp.ok) return resp;

  try {
    const raw = await resp.json();
    // Go 閸氬海顏潻鏂挎礀 { userId, username, role }閿涘苯澧犵粩顖涙埂閺?{ user: { id, username, role } }
    const user = {
      id: raw.userId ?? raw.id,
      username: raw.username,
      role: raw.role,
    };
    return Response.json({ user });
  } catch {
    return Response.json({ error: "鐟欙絾鐎介悽銊﹀煕娣団剝浼呮径杈Е" }, { status: 500 });
  }
}

