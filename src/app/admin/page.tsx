"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: number;
  username: string;
  role: "super" | "editor";
  created_at: string;
  last_login_at: string | null;
};

type LinkItem = {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
  active: number;
};

type StatDay = {
  stat_date: string;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
};
type SystemInfo = { uptimeSec: number; cpuCores: number; mem: { usageRate: number } };
type LinkHealth = { link_id: number; title: string; status_code: number | null; is_ok: number; message: string; checked_at: string };
type LinkLog = { id: number; link_id: number | null; action: string; actor_username: string; actor_role: string; created_at: string };

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<{ id: number; username: string; role: "super" | "editor" } | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<StatDay[]>([]);
  const [error, setError] = useState("");
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [health, setHealth] = useState<LinkHealth[]>([]);
  const [logs, setLogs] = useState<LinkLog[]>([]);
  const [trend7, setTrend7] = useState<Array<{ stat_date: string; link_clicks: number }>>([]);
  const [popular, setPopular] = useState<Array<{ category: string; clicks: number }>>([]);

  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    description: "",
    sort: 0,
  });
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "editor" as "editor" | "super",
  });

  const today = useMemo(
    () =>
      stats[0] || {
        stat_date: new Date().toISOString().slice(0, 10),
        page_views: 0,
        unique_visitors: 0,
        link_clicks: 0,
      },
    [stats],
  );

  const loadAll = async (role: "super" | "editor") => {
    const [linksRes, statsRes] = await Promise.all([
      fetch("/api/admin/links"),
      fetch("/api/admin/stats"),
    ]);
    if (!linksRes.ok || !statsRes.ok) throw new Error("加载失败");
    const linksData = await linksRes.json();
    const statsData = await statsRes.json();
    setLinks(linksData.links || []);
    setStats(statsData.days || []);
    setTrend7(statsData.trend7 || []);
    setPopular(statsData.popularCategories || []);

    if (role === "super") {
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    }
    const [sysRes, healthRes, logRes] = await Promise.all([
      fetch("/api/admin/system"),
      fetch("/api/admin/link-health"),
      fetch("/api/admin/logs"),
    ]);
    if (sysRes.ok) setSystem((await sysRes.json()) as SystemInfo);
    if (healthRes.ok) setHealth(((await healthRes.json()) as { health: LinkHealth[] }).health || []);
    if (logRes.ok) setLogs(((await logRes.json()) as { logs: LinkLog[] }).logs || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/admin/me");
        if (!meRes.ok) {
          router.replace("/admin/login");
          return;
        }
        const me = await meRes.json();
        setUser(me.user);
        await loadAll(me.user.role);
      } catch {
        setError("加载后台数据失败");
      } finally {
        setChecking(false);
      }
    };
    init();
  }, [router]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  };

  const submitLink = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "新增链接失败");
      setLinkForm({ title: "", url: "", description: "", sort: 0 });
      await loadAll(user!.role);
    } catch (err) {
      setError(String((err as Error).message || "新增链接失败"));
    }
  };

  const removeLink = async (id: number) => {
    await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
    await loadAll(user!.role);
  };

  const toggleActive = async (item: LinkItem) => {
    await fetch("/api/admin/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: item.active ? 0 : 1 }),
    });
    await loadAll(user!.role);
  };

  const submitUser = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "创建用户失败");
      setUserForm({ username: "", password: "", role: "editor" });
      await loadAll("super");
    } catch (err) {
      setError(String((err as Error).message || "创建用户失败"));
    }
  };
  const runHealthCheck = async () => {
    await fetch("/api/admin/link-health", { method: "POST" });
    await loadAll(user!.role);
  };

  if (checking) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="admin-shell" style={{ display: "grid", gap: 12, position: "relative", zIndex: 1 }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(248,252,255,0.72), rgba(241,248,255,0.76)), url('/admin-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="admin-card" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "rgba(226,238,252,0.94)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.18)" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            管理后台
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            当前用户：{user.username}（{user.role}）
          </div>
        </div>
        <button onClick={logout} className="admin-btn-ghost">
          退出登录
        </button>
      </div>

      {error ? (
        <div style={{ color: "#DC2626", fontSize: 12 }}>{error}</div>
      ) : null}
      <div className="admin-card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>服务器运行情况</div>
        <div style={{ minHeight: 52, fontSize: 12, color: "#334155", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span>Uptime: {system?.uptimeSec ?? 0}s</span>
          <span>CPU: {system?.cpuCores ?? 0} cores</span>
          <span>内存占用: {system?.mem?.usageRate ?? 0}%</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {[
          { label: "今日客流量(PV)", value: today.page_views },
          { label: "今日客流量(UV)", value: today.unique_visitors },
          { label: "今日点击量", value: today.link_clicks },
        ].map((item) => (
          <div key={item.label} className="admin-card" style={{ padding: 12, background: "rgba(214,231,250,0.95)", borderColor: "#93C5FD", boxShadow: "0 10px 26px rgba(37,99,235,0.16)" }}>
            <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 26, color: "#1D4ED8", fontWeight: 800 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div className="admin-card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>近7天点击走势</div>
        <div style={{ minHeight: 140, border: "1px dashed #93C5FD", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {(trend7.length ? trend7 : Array.from({ length: 7 }).map((_, i) => ({ stat_date: `D${i + 1}`, link_clicks: 0 }))).map((d) => (
              <div key={d.stat_date} style={{ textAlign: "center" }}>
                <div style={{ height: 72, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{ width: 22, height: `${Math.max(6, d.link_clicks * 6)}px`, background: "#3B82F6", borderRadius: 6, opacity: d.link_clicks ? 1 : 0.25 }} />
                </div>
                <div style={{ fontSize: 11 }}>{String(d.stat_date).slice(5)}</div>
              </div>
            ))}
          </div>
          {!trend7.length ? (
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>暂无7天点击数据，已预留图表空间。</div>
          ) : null}
        </div>
        <div style={{ fontWeight: 700, margin: "12px 0 8px" }}>热门分类（域名）</div>
        <div style={{ minHeight: 140, border: "1px dashed #93C5FD", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.5)", display: "grid", gap: 6 }}>
          {(popular.length
            ? popular
            : Array.from({ length: 5 }).map((_, i) => ({ category: `分类${i + 1}`, clicks: 0 }))).map((p) => (
            <div key={p.category} style={{ display: "grid", gridTemplateColumns: "140px 1fr 40px", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#334155", overflow: "hidden", textOverflow: "ellipsis" }}>{p.category}</span>
              <div style={{ height: 8, background: "#DBEAFE", borderRadius: 999 }}>
                <div style={{ width: `${Math.min(100, p.clicks * 10)}%`, height: "100%", background: "#2563EB", borderRadius: 999, opacity: p.clicks ? 1 : 0.25 }} />
              </div>
              <span style={{ fontSize: 12, textAlign: "right" }}>{p.clicks}</span>
            </div>
          ))}
          {!popular.length ? <div style={{ fontSize: 12, color: "#64748B" }}>暂无热门分类数据，已预留图表空间。</div> : null}
        </div>
      </div>

      <div className="admin-card" style={{ padding: 14, display: "grid", gap: 10, background: "rgba(224,237,253,0.95)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.16)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
          链接管理（editor/super）
        </div>
        <form onSubmit={submitLink} style={{ display: "grid", gap: 8 }}>
          <input
            className="admin-input"
            placeholder="标题"
            value={linkForm.title}
            onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="URL"
            value={linkForm.url}
            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="描述"
            value={linkForm.description}
            onChange={(e) =>
              setLinkForm({ ...linkForm, description: e.target.value })
            }
          />
          <input
            className="admin-input"
            type="number"
            placeholder="排序"
            value={linkForm.sort}
            onChange={(e) => setLinkForm({ ...linkForm, sort: Number(e.target.value || 0) })}
            style={{ maxWidth: 140 }}
          />
          <button type="submit" className="admin-btn" style={{ width: 120 }}>
            添加链接
          </button>
        </form>

        <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.68)", border: "1px solid #BFDBFE", borderRadius: 10, padding: 6 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["ID", "标题", "URL", "状态", "操作"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #93C5FD", padding: "8px 6px", color: "#1E3A8A", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((item) => (
                <tr key={item.id}>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.id}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.title}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.url}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.active ? "启用" : "禁用"}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px", display: "flex", gap: 6 }}>
                    <button onClick={() => toggleActive(item)} style={{ border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                      {item.active ? "禁用" : "启用"}
                    </button>
                    <button onClick={() => removeLink(item.id)} style={{ border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="admin-card" style={{ padding: 14, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>链接健康检测</div>
          <button onClick={runHealthCheck} className="admin-btn" style={{ height: 30, padding: "0 10px" }}>立即检测</button>
        </div>
        <div style={{ overflowX: "auto", minHeight: 170 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr><th style={{ textAlign: "left" }}>链接</th><th style={{ textAlign: "left" }}>状态</th><th style={{ textAlign: "left" }}>检查时间</th></tr></thead>
            <tbody>
              {(health.length ? health : [{ link_id: 0, title: "暂无检测数据", status_code: null, is_ok: 1, message: "", checked_at: "-" }]).map((h) => (
                <tr key={h.link_id} style={{ background: h.is_ok ? "transparent" : "rgba(254,202,202,0.35)" }}>
                  <td style={{ padding: "6px 4px" }}>{h.title || `#${h.link_id}`}</td>
                  <td style={{ padding: "6px 4px", color: h.is_ok ? "#059669" : "#DC2626", fontWeight: 700 }}>{h.is_ok ? "正常" : `异常 ${h.status_code ?? ""}`}</td>
                  <td style={{ padding: "6px 4px" }}>{String(h.checked_at || "").replace("T", " ").slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="admin-card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>操作日志</div>
        <div style={{ maxHeight: 220, minHeight: 220, overflow: "auto", fontSize: 12 }}>
          {(logs.length ? logs : [{ id: 0, link_id: null, action: "暂无操作日志", actor_username: "-", actor_role: "-", created_at: "-" }]).map((l) => (
            <div key={l.id} style={{ padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
              {String(l.created_at).replace("T", " ").slice(0, 19)} - {l.actor_username}({l.actor_role}) {l.action} link#{l.link_id ?? "-"}
            </div>
          ))}
        </div>
      </div>

      {user.role === "super" ? (
        <div className="admin-card" style={{ padding: 14, display: "grid", gap: 10, background: "rgba(224,237,253,0.95)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.16)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            用户管理（super）
          </div>
          <form onSubmit={submitUser} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="admin-input"
              placeholder="用户名"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="密码"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            />
            <select
              className="admin-input"
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value as "super" | "editor" })
              }
            >
              <option value="editor">editor</option>
              <option value="super">super</option>
            </select>
            <button type="submit" className="admin-btn" style={{ padding: "0 12px" }}>
              创建用户
            </button>
          </form>

          <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.68)", border: "1px solid #BFDBFE", borderRadius: 10, padding: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["ID", "用户名", "角色", "创建时间", "最近登录"].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #93C5FD", padding: "8px 6px", color: "#1E3A8A", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{u.id}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{u.username}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{u.role}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{String(u.created_at || "").replace("T", " ").slice(0, 19)}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>
                      {u.last_login_at
                        ? String(u.last_login_at).replace("T", " ").slice(0, 19)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
