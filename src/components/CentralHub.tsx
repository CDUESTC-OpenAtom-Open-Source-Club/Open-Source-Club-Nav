"use client";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, X, Zap } from "lucide-react";
import GlobeCanvas from "./GlobeCanvas";
import WorksCarousel from "./WorksCarousel";
import { RESOURCE_CATEGORIES, ResourceLink } from "@/data/resources";

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Learning: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  Practice: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Research: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  Papers: { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  Course: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Campus: { bg: "#EFF6FF", text: "#0A84FF", border: "#BFDBFE" },
  Life: { bg: "#FFFBEB", text: "#F59E0B", border: "#FDE68A" },
  Dev: { bg: "#F1F5F9", text: "#374151", border: "#E2E8F0" },
  Mirror: { bg: "#EFF6FF", text: "#0A84FF", border: "#BFDBFE" },
  IDE: { bg: "#FAF5FF", text: "#7C3AED", border: "#DDD6FE" },
  DevOps: { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  Docs: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
};

function getLinkMeta(url: string) {
  if (!url || url === "#") return { label: "Campus Resource", href: "#", isExternal: false };
  try {
    const parsed = new URL(url);
    return { label: parsed.host.replace(/^www\./, ""), href: url, isExternal: true };
  } catch {
    return { label: "Resource", href: url, isExternal: false };
  }
}

function HologramPanel({ category, onClose }: { category: string; onClose: () => void }) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const cat = RESOURCE_CATEGORIES.find((c) => c.id === category);
  const hovered = useMemo(() => {
    if (!cat || hoveredLink === null) return null;
    return cat.links[hoveredLink] ?? null;
  }, [cat, hoveredLink]);

  if (!cat) return null;
  const hoveredMeta = hovered ? getLinkMeta(hovered.url) : null;

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(248,250,252,0.97)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", animation: "panelIn 0.28s cubic-bezier(0.25,0.46,0.45,0.94)", zIndex: 10, padding: 20, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
            <span style={{ fontSize: 10, fontFamily: '"Courier New", monospace', color: cat.color, letterSpacing: 1.6, fontWeight: 600 }}>SECTOR // {cat.sublabel.toUpperCase()}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0, lineHeight: 1.15 }}>{cat.label}</h2>
          <p style={{ fontSize: 11, color: "#64748B", margin: "5px 0 0" }}>{cat.links.length} resources</p>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.18s ease" }}>
          <X size={14} color="#94A3B8" />
        </button>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}22, transparent)`, borderRadius: 2, marginBottom: 12 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 10 }} onMouseLeave={() => setHoveredLink(null)}>
        {cat.links.map((link, i) => {
          const tagStyle = TAG_COLORS[link.tag] || TAG_COLORS.Docs;
          const isHovered = hoveredLink === i;
          const linkMeta = getLinkMeta(link.url);
          return (
            <a
              key={i}
              href={link.url}
              target={linkMeta.isExternal ? "_blank" : undefined}
              rel={linkMeta.isExternal ? "noopener noreferrer" : undefined}
              onMouseEnter={() => setHoveredLink(i)}
              style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 84, padding: "10px 12px", borderRadius: 10, border: `1px solid ${isHovered ? cat.color + "55" : "#E5E7EB"}`, background: isHovered ? `${cat.color}06` : "white", textDecoration: "none", transition: "all 0.15s ease", position: "relative", overflow: "hidden", transform: isHovered ? "translateY(-2px)" : "translateY(0)", boxShadow: isHovered ? `0 8px 16px ${cat.color}12` : "none" }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: cat.color, borderRadius: "3px 0 0 3px", transform: isHovered ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 0.15s ease", boxShadow: `0 0 6px ${cat.color}` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 8, padding: "2px 8px", borderRadius: 999, background: tagStyle.bg, color: tagStyle.text, border: `1px solid ${tagStyle.border}`, fontWeight: 500, letterSpacing: 0.2 }}>{link.tag}</span>
                <ExternalLink size={10} color={isHovered ? cat.color : "#CBD5E1"} style={{ transition: "color 0.15s" }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.title}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
                <span style={{ fontSize: 10, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkMeta.label}</span>
                <span style={{ fontSize: 9, color: isHovered ? cat.color : "#CBD5E1", fontFamily: '"Courier New", monospace', flexShrink: 0 }}>INFO</span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Hover detail panel */}
      <div style={{ marginTop: 12, border: `1px solid ${cat.color}26`, background: `linear-gradient(120deg, white, ${cat.color}06)`, borderRadius: 12, padding: "10px 12px", minHeight: 88, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
        {hovered ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{hovered.title}</div>
            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.45 }}>{hovered.desc}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 10, color: cat.color, fontFamily: '"Courier New", monospace' }}>{hoveredMeta?.label}</span>
              {hoveredMeta?.isExternal ? (
                <a href={hoveredMeta.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#0A84FF", textDecoration: "none", border: "1px solid #BFDBFE", background: "#EFF6FF", borderRadius: 999, padding: "3px 8px", fontWeight: 600, transition: "all 0.18s ease" }}>Open</a>
              ) : (
                <span style={{ fontSize: 10, color: "#94A3B8", border: "1px solid #E5E7EB", borderRadius: 999, padding: "3px 8px" }}>Internal</span>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>Move your pointer over a card to preview full details here.</div>
        )}
      </div>

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface CentralHubProps {
  activeCategory: string | null;
  parallax: { x: number; y: number };
  onClosePanel: () => void;
}

export default function CentralHub({ activeCategory, parallax, onClosePanel }: CentralHubProps) {
  const [orgStats, setOrgStats] = useState({ members: 42, projects: 18, stars: 1200 });

  useEffect(() => {
    fetch("/api/org-stats")
      .then((r) => r.json())
      .then((data) => {
        setOrgStats({
          members: data.members || 42,
          projects: data.projects || 18,
          stars: data.stars || 1200,
        });
      })
      .catch(() => {});
  }, []);

  const formatStars = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", background: "rgba(255,255,255,0.5)", overflow: "hidden" }}>
      {/* Grid background with parallax */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(10,132,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.04) 1px, transparent 1px)", backgroundSize: "36px 36px", transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`, transition: "transform 0.1s ease", pointerEvents: "none" }} />

      {/* Glow circle */}
      <div style={{ position: "absolute", top: "10%", left: "50%", transform: `translateX(-50%) translate(${parallax.x * 0.5}px, ${parallax.y * 0.3}px)`, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(10,132,255,0.06) 0%, transparent 70%)", pointerEvents: "none", transition: "transform 0.15s ease" }} />

      {activeCategory && <HologramPanel category={activeCategory} onClose={onClosePanel} />}

      {!activeCategory && (
        <>
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 10, position: "relative" }}>
            {/* Status badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.9)", border: "1px solid #E5E7EB", borderRadius: 999, padding: "3px 11px", fontSize: 10, color: "#64748B", backdropFilter: "blur(8px)" }}>
              <Zap size={10} color="#0A84FF" />
              <span>Select a category to open resource panel</span>
              <span style={{ width: 1, height: 10, background: "#E5E7EB", display: "inline-block" }} />
              <span style={{ color: "#0A84FF", fontWeight: 500 }}>KCOS.CLUB</span>
            </div>

            {/* Globe with parallax */}
            <div style={{ transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.4}px)`, transition: "transform 0.15s ease" }}>
              <GlobeCanvas size={206} />
            </div>

            {/* Club title */}
            <div style={{ textAlign: "center", marginTop: -12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", letterSpacing: 1, lineHeight: 1.1 }}>
                科成<span style={{ color: "#0A84FF" }}>开放原子开源社团</span>
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginTop: 4, fontFamily: '"Courier New", monospace' }}>
                Kecheng OpenAtom Open Source Club
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: `${orgStats.members} members`, color: "#0A84FF" },
                { label: `${orgStats.projects} projects`, color: "#06E5CC" },
                { label: `${formatStars(orgStats.stars)} stars`, color: "#F59E0B" },
                { label: "year-round activity", color: "#10B981" },
              ].map((p) => (
                <div key={p.label} style={{ padding: "2px 9px", borderRadius: 999, border: "1px solid #E5E7EB", background: "rgba(255,255,255,0.8)", fontSize: 9, color: "#374151", fontWeight: 500, backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.color }} />
                  {p.label}
                </div>
              ))}
            </div>

            <div style={{ width: "80%", height: 1, background: "linear-gradient(90deg, transparent, #E5E7EB, transparent)", marginTop: 2 }} />

            {/* Info cards */}
            <div style={{ width: "88%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 2 }}>
              {[
                { title: "域名", value: "kcos.club", hint: "brand identity", color: "#0A84FF" },
                { title: "官网", value: "opensouce-club.top", hint: "public access", color: "#10B981" },
                { title: "活动状态", value: "weekly update", hint: "community active", color: "#F59E0B" },
              ].map((item) => (
                <div key={item.title} style={{ border: "1px solid #E5E7EB", borderRadius: 10, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(6px)", padding: "7px 8px", display: "flex", flexDirection: "column", gap: 2, minHeight: 56 }}>
                  <div style={{ fontSize: 8, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  <div style={{ fontSize: 8, color: "#94A3B8", letterSpacing: 0.3 }}>{item.hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>
            <WorksCarousel />
          </div>
        </>
      )}

      {/* Ambient wave */}
      <div style={{ position: "absolute", left: "15%", right: "15%", top: "26%", height: 120, borderRadius: 999, background: "linear-gradient(120deg, rgba(10,132,255,0.10), rgba(16,185,129,0.08), rgba(245,158,11,0.08))", filter: "blur(28px)", pointerEvents: "none", animation: "ambientWave 14s ease-in-out infinite" }} />

      <style>{`
        @keyframes ambientWave {
          0%, 100% { transform: translateX(-2%) scale(1); opacity: 0.45; }
          50% { transform: translateX(2%) scale(1.04); opacity: 0.72; }
        }
      `}</style>
    </main>
  );
}
