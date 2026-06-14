"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  MapPin,
  Wrench,
  ChevronRight,
  ExternalLink,
  Gamepad2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/data/resources";

const ICON_MAP: Record<string, LucideIcon> = { Brain, MapPin, Wrench };

const BASE_FRIEND_LINKS = [
  { title: "电子科技大学成都学院", url: "https://www.cduestc.fun/" },
  { title: "科成星球", url: "https://github.com/CDUESTC-OpenAtom-Open-Source-Club" },
];

const PANEL_WIDTH = "clamp(214px, 16vw, 252px)";
const PUBLIC_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const applyCategoryHoverStyle = (target: HTMLElement) => {
  target.style.background = "#F8FAFC";
  target.style.border = "1px solid #E5E7EB";
  target.style.transform = "translateY(-1px)";
  target.style.boxShadow = "0 6px 12px rgba(15,23,42,0.06)";
};

const resetCategoryHoverStyle = (target: HTMLElement) => {
  target.style.background = "transparent";
  target.style.border = "1px solid transparent";
  target.style.transform = "translateY(0)";
  target.style.boxShadow = "none";
};

const applyFriendLinkHoverStyle = (target: HTMLElement) => {
  const cs = getComputedStyle(target);
  target.style.transform = "translateY(-1px)";
  target.style.boxShadow = cs.getPropertyValue("--shadow-hover").trim() || "0 5px 10px rgba(15,23,42,0.08)";
  target.style.borderColor = cs.getPropertyValue("--hover-border").trim() || "#BFDBFE";
};

const resetFriendLinkHoverStyle = (target: HTMLElement) => {
  const cs = getComputedStyle(target);
  target.style.transform = "translateY(0)";
  target.style.boxShadow = "none";
  target.style.borderColor = cs.getPropertyValue("--border-soft").trim() || "#E5E7EB";
};

type LeftPanelProps = {
  activeCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  isDarkMode?: boolean;
};

type LinkItem = {
  title: string;
  url: string;
};

export default function LeftPanel({
  activeCategory,
  onCategorySelect,
  isDarkMode = false,
}: LeftPanelProps) {
  const [remoteFriendLinks, setRemoteFriendLinks] = useState<LinkItem[]>([]);
  const [remoteMiniGames, setRemoteMiniGames] = useState<LinkItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const syncFriendLinks = async () => {
      try {
        const res = await fetch("/api/links?module=friend_links");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.links) ? data.links : [];
        if (cancelled) return;
        const normalized = list
          .map((item: { title?: unknown; url?: unknown }) => ({
            title: String(item?.title || "").trim(),
            url: String(item?.url || "").trim(),
          }))
          .filter((item: LinkItem) => item.title && item.url);
        setRemoteFriendLinks(normalized);
      } catch {
        // ignore network errors, keep base links
      }
    };

    void syncFriendLinks();
    const timer = window.setInterval(() => {
      void syncFriendLinks();
    }, PUBLIC_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncMiniGames = async () => {
      try {
        const res = await fetch("/api/links?module=mini_games");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.links) ? data.links : [];
        if (cancelled) return;
        const normalized = list
          .map((item: { title?: unknown; url?: unknown }) => ({
            title: String(item?.title || "").trim(),
            url: String(item?.url || "").trim(),
          }))
          .filter((item: LinkItem) => item.title);
        setRemoteMiniGames(normalized);
      } catch {
        // ignore network errors
      }
    };

    void syncMiniGames();
    const timer = window.setInterval(() => {
      void syncMiniGames();
    }, PUBLIC_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const friendLinks = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...BASE_FRIEND_LINKS, ...remoteFriendLinks];
    return merged.filter((item) => {
      const key = `${item.title}::${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [remoteFriendLinks]);

  return (
    <aside
      style={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        background: "var(--panel-bg)",
        borderRight: "1px solid var(--border-soft)",
        display: "flex",
        flexDirection: "column",
        padding: "14px 0",
        gap: 0,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "0 14px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        <span
          style={{
            fontSize: 8,
            color: "#94A3B8",
            letterSpacing: 1.7,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          资源矩阵
        </span>
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          padding: "0 8px",
        }}
      >
        {RESOURCE_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon];
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(isActive ? null : cat.id)}
              data-ui-touch="true"
              style={{
                width: "100%",
                background: isActive ? `${cat.color}14` : "transparent",
                border: isActive
                  ? `1px solid ${cat.color}30`
                  : "1px solid transparent",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.18s ease",
                position: "relative",
                overflow: "hidden",
                transform: isActive ? "translateY(-1px)" : "translateY(0)",
                boxShadow: isActive ? `0 6px 14px ${cat.color}12` : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  applyCategoryHoverStyle(e.currentTarget);
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  resetCategoryHoverStyle(e.currentTarget);
                }
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    background: cat.color,
                    borderRadius: "0 3px 3px 0",
                    boxShadow: `0 0 6px ${cat.color}`,
                  }}
                />
              )}

              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: isActive
                    ? `${cat.color}18`
                    : "var(--bg-icon)",
                  border: `1px solid ${isActive ? cat.color + "40" : "#E5E7EB"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {Icon && (
                  <Icon size={14} color={isActive ? cat.color : "#64748B"} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    lineHeight: 1.2,
                  }}
                >
                  {cat.label}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: isActive ? cat.color : "#94A3B8",
                    letterSpacing: 0.35,
                    marginTop: 2,
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  {cat.sublabel}
                </div>
              </div>

              <ChevronRight
                size={12}
                color={isActive ? cat.color : "#CBD5E1"}
                style={{
                  transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  flexShrink: 0,
                }}
              />
            </button>
          );
        })}
      </nav>

      <div style={{ margin: "12px 14px 8px", height: 1, background: "#F1F5F9" }} />

      <div style={{ padding: "0 14px 12px" }}>
        <div
          style={{
            fontSize: 8,
            color: "#94A3B8",
            letterSpacing: 1.7,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          友情链接
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {friendLinks.map((item, idx) => (
            <a
              key={`${item.title}-${idx}`}
              href={item.url}
              target={item.url.startsWith("http") ? "_blank" : undefined}
              rel={
                item.url.startsWith("http") ? "noopener noreferrer" : undefined
              }
              data-ui-touch="true"
              style={{
                textDecoration: "none",
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                background: "var(--card-bg-semi)",
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => applyFriendLinkHoverStyle(e.currentTarget)}
              onMouseLeave={(e) => resetFriendLinkHoverStyle(e.currentTarget)}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-bright)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {item.title}
              </span>
              <ExternalLink
                size={11}
                color={item.url.startsWith("http") ? "#94A3B8" : "#CBD5E1"}
              />
            </a>
          ))}
        </div>

        <div
          style={{
            marginTop: 10,
            borderTop: "1px dashed #E2E8F0",
            paddingTop: 10,
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: "#94A3B8",
              letterSpacing: 1.7,
              textTransform: "uppercase",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Gamepad2 size={9} />
            小游戏
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {(remoteMiniGames.length > 0 ? remoteMiniGames : [{ title: "吃豆人小游戏", url: "/games" }]).map((item, idx) => (
              <a
                key={`${item.title}-${idx}`}
                href={item.url}
                data-ui-touch="true"
                style={{
                  textDecoration: "none",
                  border: "1px solid var(--border-chip)",
                  borderRadius: 8,
                  background: "var(--card-bg-semi)",
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => applyFriendLinkHoverStyle(e.currentTarget)}
                onMouseLeave={(e) => resetFriendLinkHoverStyle(e.currentTarget)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <Gamepad2 size={11} color="#0A84FF" />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                  </span>
                </span>
                <ChevronRight size={11} color="#0A84FF" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
