// @route-desc BFF API route proxy/handler for /api/admin/me/route.ts
// 鑾峰彇褰撳墠鐧诲綍绠＄悊鍛樹俊鎭?- 浠ｇ悊鍒?Go 鍚庣骞跺寘瑁呭搷搴旀牸寮?
import { fetchBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const resp = await fetchBackend(request, "/api/admin/me");
  if (!resp.ok) return resp;

  try {
    const raw = await resp.json();
    // Go 鍚庣杩斿洖 { userId, username, role }锛屽墠绔湡鏈?{ user: { id, username, role } }
    const user = {
      id: raw.userId ?? raw.id,
      username: raw.username,
      role: raw.role,
    };
    return Response.json({ user });
  } catch {
    return Response.json({ error: "瑙ｆ瀽鐢ㄦ埛淇℃伅澶辫触" }, { status: 500 });
  }
}

