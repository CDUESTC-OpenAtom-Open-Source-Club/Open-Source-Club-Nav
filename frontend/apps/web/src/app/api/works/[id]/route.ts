import { fetchPublicBackend } from "@/lib/backend-proxy";

export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchPublicBackend(request, `/api/works/${id}`, {
    browserMaxAgeSeconds: 60,
    sharedMaxAgeSeconds: 300,
  });
}
