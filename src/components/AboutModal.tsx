"use client";
import { useState, useEffect, useRef } from "react";
import { X, ChevronRight } from "lucide-react";
import {
  ORG_DEPARTMENTS,
  MISSION_POINTS,
  OPEN_SOURCE_COLLAB_RULES,
  MILESTONES,
  CLUB_CHARTER,
  CLUB_POINTS_RULE_GROUPS,
  CLUB_POINTS_REWARD_NOTE,
  ABOUT_SECTION_NAV,
} from "@/data/clubInfo";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const [activeSection, setActiveSection] = useState("mission");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { root: container, threshold: 0.3 }
    );

    ABOUT_SECTION_NAV.forEach((s) => {
      const el = container.querySelector(`#${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;



  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "aboutFadeIn 0.22s ease",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(12px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "92vw",
          maxWidth: 900,
          height: "84vh",
          background: "rgba(255,255,255,0.97)",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
          display: "flex",
          overflow: "hidden",
          animation: "aboutSlideIn 0.28s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        {/* Sidebar nav */}
        <div
          style={{
            width: 180,
            minWidth: 180,
            background: "linear-gradient(180deg, #F8FAFC, #FFFFFF)",
            borderRight: "1px solid #E5E7EB",
            padding: "20px 0",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            style={{
              padding: "0 16px 14px",
              fontSize: 9,
              color: "#94A3B8",
              letterSpacing: 1.7,
              textTransform: "uppercase",
              fontFamily: '"Courier New", monospace',
            }}
          >
            ABOUT KCOS
          </div>
          {ABOUT_SECTION_NAV.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  const el = contentRef.current?.querySelector(`#${s.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveSection(s.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(10,132,255,0.08), transparent)"
                    : "transparent",
                  border: "none",
                  borderLeft: isActive ? "3px solid #0A84FF" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: isActive ? "#0A84FF" : "#CBD5E1",
                    fontFamily: '"Courier New", monospace',
                    fontWeight: 600,
                    width: 18,
                  }}
                >
                  {s.index}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: isActive ? "#0F172A" : "#64748B",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
                {isActive && (
                  <ChevronRight size={10} color="#0A84FF" style={{ marginLeft: "auto" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1px solid #E5E7EB",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              transition: "all 0.15s ease",
            }}
          >
            <X size={14} color="#94A3B8" />
          </button>

          {/* Section 1: Mission */}
          <section id="mission" style={{ marginBottom: 40, scrollMarginTop: 20 }}>
            <SectionHeader index="01" title="社团使命" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 14,
              }}
            >
              {MISSION_POINTS.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#F8FAFC",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: "rgba(10,132,255,0.1)",
                      border: "1px solid rgba(10,132,255,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#0A84FF",
                      flexShrink: 0,
                      fontFamily: '"Courier New", monospace',
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{p}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Departments */}
          <section id="departments" style={{ marginBottom: 40, scrollMarginTop: 20 }}>
            <SectionHeader index="02" title="社团部门" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
                marginTop: 14,
              }}
            >
              {ORG_DEPARTMENTS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#BFDBFE";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(10,132,255,0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0F172A",
                      marginBottom: 6,
                    }}
                  >
                    {d.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.55 }}>{d.duty}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Collab rules */}
          <section id="collab" style={{ marginBottom: 40, scrollMarginTop: 20 }}>
            <SectionHeader index="03" title="开源协作规范" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 14,
              }}
            >
              {OPEN_SOURCE_COLLAB_RULES.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#0A84FF",
                      fontWeight: 600,
                      fontFamily: '"Courier New", monospace',
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(10,132,255,0.08)",
                      height: "fit-content",
                      flexShrink: 0,
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.55 }}>{r.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Timeline */}
          <section id="timeline" style={{ marginBottom: 40, scrollMarginTop: 20 }}>
            <SectionHeader index="04" title="里程碑时间线" />
            <div style={{ marginTop: 14, position: "relative", paddingLeft: 20 }}>
              <div
                style={{
                  position: "absolute",
                  left: 6,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: "linear-gradient(180deg, #0A84FF, #06E5CC, #10B981)",
                  borderRadius: 2,
                }}
              />
              {MILESTONES.map((m, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: i < MILESTONES.length - 1 ? 18 : 0,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -17,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#0A84FF",
                      border: "2px solid white",
                      boxShadow: "0 0 6px rgba(10,132,255,0.4)",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0F172A",
                      }}
                    >
                      {m.phase}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "#0A84FF",
                        fontFamily: '"Courier New", monospace',
                        fontWeight: 500,
                      }}
                    >
                      {m.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{m.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Charter */}
          <section id="charter" style={{ marginBottom: 40, scrollMarginTop: 20 }}>
            <SectionHeader index="05" title="社团公约" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 8,
                marginTop: 14,
              }}
            >
              {CLUB_CHARTER.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    fontSize: 11,
                    color: "#475569",
                    lineHeight: 1.55,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      color: "#0A84FF",
                      fontFamily: '"Courier New", monospace',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {c}
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Points */}
          <section id="points" style={{ marginBottom: 20, scrollMarginTop: 20 }}>
            <SectionHeader index="06" title="社团积分" />

            {/* Points rules */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CLUB_POINTS_RULE_GROUPS.map((g, gi) => (
                <div
                  key={gi}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#F8FAFC",
                      borderBottom: "1px solid #E5E7EB",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    {g.title}
                  </div>
                  <div style={{ padding: "6px 0" }}>
                    {g.items.map((item, ii) => (
                      <div
                        key={ii}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "5px 12px",
                          fontSize: 11,
                          gap: 8,
                        }}
                      >
                        <span style={{ flex: 1, color: "#475569" }}>{item.name}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#0A84FF",
                            fontWeight: 600,
                            fontFamily: '"Courier New", monospace',
                          }}
                        >
                          {item.points}
                        </span>
                        {item.note && (
                          <span style={{ fontSize: 9, color: "#94A3B8" }}>{item.note}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                fontSize: 10,
                color: "#EA580C",
                lineHeight: 1.5,
              }}
            >
              {CLUB_POINTS_REWARD_NOTE}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes aboutFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aboutSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <span
          style={{
            fontSize: 9,
            color: "#0A84FF",
            fontFamily: '"Courier New", monospace',
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          SECTION {index}
        </span>
        <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>{title}</h2>
    </div>
  );
}
