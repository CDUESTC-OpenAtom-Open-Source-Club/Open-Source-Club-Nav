// @ts-nocheck
"use client";
import Link from "next/link";
import {
  Brain,
  MapPin,
  Wrench,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/data/resources";

const ICON_MAP = { Brain, MapPin, Wrench };

const FRIEND_LINKS = [
  { title: "电子科技大学成都学院", url: "https://www.cduestc.fun/" },
  { title: "社团成员博客", url: "https://opensouce-club.top/" },
  { title: "相关技术社区", url: "https://github.com/CDUESTC-OpenAtom-Club" },
];

const PANEL_WIDTH = "clamp(214px, 16vw, 252px)";

const applyCategoryHoverStyle = (target) => {
  target.style.background = "#F8FAFC";
  target.style.border = "1px solid #E5E7EB";
  target.style.transform = "translateY(-1px)";
  target.style.boxShadow = "0 6px 12px rgba(15,23,42,0.06)";
};

const resetCategoryHoverStyle = (target) => {
  target.style.background = "transparent";
  target.style.border = "1px solid transparent";
  target.style.transform = "translateY(0)";
  target.style.boxShadow = "none";
};

const applyFriendLinkHoverStyle = (target) => {
  target.style.transform = "translateY(-1px)";
  target.style.boxShadow = "0 5px 10px rgba(15,23,42,0.08)";
  target.style.borderColor = "#BFDBFE";
};

const resetFriendLinkHoverStyle = (target) => {
  target.style.transform = "translateY(0)";
  target.style.boxShadow = "none";
  target.style.borderColor = "#E5E7EB";
};

export default function LeftPanel({
  activeCategory,
  onCategorySelect,
  isDarkMode = false,
}) {
  return (
    <aside
      style={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        background: isDarkMode
          ? "rgba(15,23,42,0.92)"
          : "rgba(255,255,255,0.9)",
        borderRight: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
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
                    : isDarkMode
                      ? "#1E293B"
                      : "#F1F5F9",
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
                      ? isDarkMode
                        ? "#F8FAFC"
                        : "#0F172A"
                      : isDarkMode
                        ? "#CBD5E1"
                        : "#374151",
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
          {FRIEND_LINKS.map((item, idx) => (
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
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                background: "#FFFFFF",
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
                  color: "#334155",
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

        <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px dashed #DBEAFE" }}>
          <Link
            href="/games"
            style={{
              display: "block",
              textDecoration: "none",
              border: "1px dashed #BFDBFE",
              borderRadius: 10,
              background: "linear-gradient(180deg, #F8FBFF 0%, #EFF6FF 100%)",
              padding: "8px 9px",
              textAlign: "center",
              color: "#94A3B8",
              fontSize: 10,
              letterSpacing: 1.2,
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0A84FF";
              e.currentTarget.style.borderColor = "#93C5FD";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 8px 18px rgba(37,99,235,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94A3B8";
              e.currentTarget.style.borderColor = "#BFDBFE";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            解压小游戏
          </Link>
        </div>
      </div>
    </aside>
  )
}
