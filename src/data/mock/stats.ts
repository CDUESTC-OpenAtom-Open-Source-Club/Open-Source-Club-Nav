export const MOCK_ORG_STATS = {
  members: 42,
  projects: 18,
  stars: 1200,
  source: "mock",
};

export function getMockAdminStats() {
  const today = {
    stat_date: new Date().toISOString().slice(0, 10),
    page_views: 1280,
    unique_visitors: 426,
    link_clicks: 318,
  };
  const trend7 = Array.from({ length: 7 }).map((_, index) => ({
    stat_date: new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10),
    link_clicks: [26, 32, 28, 41, 36, 52, 49][index],
  }));
  const days = trend7.map((item, index) => ({
    stat_date: item.stat_date,
    page_views: [980, 1040, 1012, 1188, 1210, 1302, 1280][index],
    unique_visitors: [318, 336, 322, 374, 388, 420, 426][index],
    link_clicks: item.link_clicks,
  })).reverse();
  const popularRepos = [
    { repo: "cdcas/open-source-club-nav", clicks: 52 },
    { repo: "openatomfoundation/openatom-docs", clicks: 37 },
    { repo: "vercel/next.js", clicks: 26 },
    { repo: "facebook/react", clicks: 22 },
    { repo: "nodejs/node", clicks: 18 },
  ];
  return { today, days, trend7, popularRepos, popularCategories: popularRepos };
}
