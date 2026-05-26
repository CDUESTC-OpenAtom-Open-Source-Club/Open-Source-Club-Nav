export const MOCK_LOGS = [
  { id: 1, link_id: 1, action: "create", actor_username: "admin", actor_role: "super", created_at: new Date().toISOString() },
  { id: 2, link_id: 2, action: "update", actor_username: "editor", actor_role: "editor", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, link_id: 3, action: "disable", actor_username: "admin", actor_role: "super", created_at: new Date(Date.now() - 7200000).toISOString() },
];
