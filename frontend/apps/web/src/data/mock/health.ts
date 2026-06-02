export const MOCK_HEALTH = [
  { link_id: 1, url: "https://openatom.cn", status_code: 200, is_ok: 1, checked_at: new Date().toISOString(), message: "", title: "OpenAtom Docs" },
  { link_id: 2, url: "https://github.com", status_code: 200, is_ok: 1, checked_at: new Date(Date.now() - 1800000).toISOString(), message: "", title: "GitHub" },
  { link_id: 3, url: "https://nextjs.org", status_code: 503, is_ok: 0, checked_at: new Date(Date.now() - 5400000).toISOString(), message: "HTTP 503", title: "Next.js" },
];
