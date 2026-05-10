"use client";
import { useState, useEffect } from "react";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Tag,
  GitFork,
  Plus,
  RefreshCw,
} from "lucide-react";
import { EVENT_TYPE_LABELS, GitHubEvent } from "@/data/githubActivity";

const EVENT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  PushEvent: GitCommit,
  PullRequestEvent: GitPullRequest,
  CreateEvent: Plus,
  IssuesEvent: AlertCircle,
  ReleaseEvent: Tag,
  ForkEvent: GitFork,
};

function ActivityCard({ item, index }: { item: GitHubEvent; index: number }) {
  const Icon = EVENT_ICONS[item.type] || GitCommit;
  const label = EVENT_TYPE_LABELS[item.type] || "EVENT";

  // Optimize display message to avoid monotonous "push"
  const getDisplayMessage = () => {
    const msg = item.message.trim();
    const isBoring = !msg || ["push", "update", "updated", "commit", "."].includes(msg.toLowerCase());

    let finalMsg = item.message;

    if (item.type === "PushEvent") {
      if (isBoring) {
        if (item.commits && item.commits > 1) {
          finalMsg = `Pushed ${item.commits} commits`;
        } else {
          // Provide varied expressions for single push events
          const templates = [
            "Pushed new code updates",
            "Synced latest changes",
            "Updated project resources",
            "Submitted code optimizations",
            "Completed functional updates",
          ];
          const charCode = item.id.charCodeAt(item.id.length - 1) || 0;
          const templateIdx = charCode % templates.length;
          finalMsg = templates[templateIdx];
        }
      }
      return `Push: ${finalMsg}`;
    }

    if (item.type === "CreateEvent" && msg.startsWith("init:")) {
      return msg.replace("init:", "Init: ");
    }

    if (item.type === "PullRequestEvent" && msg.startsWith("PR:")) {
      return msg.replace("PR:", "PR: ");
    }

    return item.message;
  };

  const displayMessage = getDisplayMessage();

  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #F1F5F9",
        background: "#FAFBFC",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        animation: `slideIn 0.3s ease ${index * 0.05}s both`,
        transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(15,23,42,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#F1F5F9";
        e.currentTarget.style.background = "#FAFBFC";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}12`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: `${item.color}12`, color: item.color, fontWeight: 600, letterSpacing: 0.5, fontFamily: '"Courier New", monospace', flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: 9, color: "#CBD5E1", fontFamily: '"Courier New", monospace' }}>{item.time}</span>
        </div>
        <div style={{ fontSize: 12, color: "#374151", marginTop: 4, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={displayMessage}>
          {displayMessage}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${item.color}18`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: item.color }}>{item.actor.avatar}</div>
          <span style={{ fontSize: 10, color: "#94A3B8" }}>{item.actor.login}</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>·</span>
          <span style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.repo.split("/")[1] || item.repo}</span>
        </div>
        {item.branch && (
          <div style={{ marginTop: 4, fontSize: 9, color: "#94A3B8", fontFamily: '"Courier New", monospace', background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 6px", display: "inline-block" }}>
            ⌥ {item.branch}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RightPanel() {
  const [activity, setActivity] = useState<GitHubEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [source, setSource] = useState<string>("loading");

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivity(data.activities || []);
      setSource(data.source || "unknown");
    } catch {
      setSource("error");
    } finally {
      setLastUpdated(new Date());
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diffSec = Math.round((new Date().getTime() - lastUpdated.getTime()) / 1000);
  const diffLabel = diffSec < 60 ? `${diffSec}s 前` : `${Math.round(diffSec / 60)}m 前`;

  return (
    <aside style={{ width: 280, minWidth: 280, background: "rgba(255,255,255,0.9)", borderLeft: "1px solid #E5E7EB", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>成员动态</div>
          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, letterSpacing: 0.5 }}>更新于 {diffLabel} · {source === "github" ? "LIVE" : source === "loading" ? "LOADING..." : "MOCK"}</div>
        </div>
        <button onClick={refresh} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E5E7EB", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.18s ease" }}>
          <RefreshCw size={13} color="#94A3B8" style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Live indicator */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 999, padding: "3px 8px", fontSize: 9, color: "#EA580C", fontWeight: 500, letterSpacing: 0.5 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#EA580C", animation: "pulse 2s infinite" }} />
          {source === "github" ? "LIVE · GitHub API Connected" : source === "loading" ? "CONNECTING..." : "MOCK · GitHub API 未配置"}
        </div>
      </div>

      {/* Activity list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {activity.map((item, i) => (
          <ActivityCard key={item.id + i} item={item} index={i} />
        ))}
      </div>

      {/* Footer stats */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
        {[
          { label: "今日提交", value: "23", color: "#0A84FF" },
          { label: "活跃成员", value: "7", color: "#06E5CC" },
          { label: "合并 PR", value: "4", color: "#10B981" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: '"Courier New", monospace' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </aside>
  );
}
