"use client";
import { useEffect, useState } from "react";
import {
  Brain,
  MapPin,
  Wrench,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/data/resources";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Brain,
  MapPin,
  Wrench,
};

const DEFAULT_FRIEND_LINKS = [
  { title: "Cooo Wiki 友链页", url: "https://wiki.cooo.site/links" },
  { title: "HDU CS Wiki", url: "https://hdu-cs.wiki/" },
];



interface LeftPanelProps {
  activeCategory: string | null;
  onCategorySelect: (id: string | null) => void;
}

export default function LeftPanel({ activeCategory, onCategorySelect }: LeftPanelProps) {
  const [friendLinks, setFriendLinks] = useState(DEFAULT_FRIEND_LINKS);


  useEffect(() => {
    fetch("/api/links")
      .then((res) => res.json())
      .then((data) => {
        if (data.links?.length) {
          setFriendLinks(data.links.map((l: { title: string; url: string }) => ({ title: l.title, url: l.url })));
        }
      })
      .catch(() => {});
  }, []);



  return (
    <aside
      style={{
        width: 232,
        minWidth: 232,
        background: "rgba(255,255,255,0.9)",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        padding: "14px 0",
        gap: 0,
        overflowY: "auto",
      }}
    >
      {/* Section header */}
      <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        <span style={{ fontSize: 8, color: "#94A3B8", letterSpacing: 1.7, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          资源矩阵
        </span>
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      </div>

      {/* Category nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 8px" }}>
        {RESOURCE_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon];
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(isActive ? null : cat.id)}
              style={{
                width: "100%",
                background: isActive ? `linear-gradient(135deg, ${cat.color}10, ${cat.color}08)` : "transparent",
                border: isActive ? `1px solid ${cat.color}30` : "1px solid transparent",
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
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.border = "1px solid #E5E7EB";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(15,23,42,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.border = "1px solid transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
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
                  background: isActive ? `${cat.color}18` : "#F1F5F9",
                  border: `1px solid ${isActive ? cat.color + "40" : "#E5E7EB"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {Icon && <Icon size={14} color={isActive ? cat.color : "#64748B"} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#0F172A" : "#374151", lineHeight: 1.2 }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 8, color: isActive ? cat.color : "#94A3B8", letterSpacing: 0.35, marginTop: 2, fontFamily: '"Courier New", monospace' }}>
                  {cat.sublabel}
                </div>
              </div>
              <ChevronRight
                size={12}
                color={isActive ? cat.color : "#CBD5E1"}
                style={{ transform: isActive ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
              />
            </button>
          );
        })}
      </nav>

      <div style={{ margin: "12px 14px 8px", height: 1, background: "#F1F5F9" }} />

      {/* Friend links */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{ fontSize: 8, color: "#94A3B8", letterSpacing: 1.7, textTransform: "uppercase", marginBottom: 6 }}>友情链接</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {friendLinks.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
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
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 5px 10px rgba(15,23,42,0.08)";
                e.currentTarget.style.borderColor = "#BFDBFE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <span style={{ fontSize: 10, color: "#334155", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {item.title}
              </span>
              <ExternalLink size={11} color="#94A3B8" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
