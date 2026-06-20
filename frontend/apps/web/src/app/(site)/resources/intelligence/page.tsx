"use client";

import Link from "next/link";
import { RESOURCE_CATEGORIES } from "@/data/resources";

export default function IntelligencePage() {
  const category = RESOURCE_CATEGORIES.find((c) => c.id === "intelligence");
  if (!category) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* 面包屑导航 */}
        <nav
          style={{
            marginBottom: 32,
            fontSize: 14,
            color: "#64748b",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
            }}
          >
            首页
          </Link>
          <span style={{ margin: "0 8px" }}>/</span>
          <span>资源导航</span>
          <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>智库</span>
        </nav>

        {/* 页面标题 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 16,
              background: "linear-gradient(135deg, #0A84FF 0%, #38BDF8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {category.label}
          </h1>
          <p
            style={{
              fontSize: 20,
              color: "#475569",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            {category.sublabel} - 计算机科学自学路线、算法训练、学术论文、在线课程等学习资源
          </p>
        </div>

        {/* 资源网格 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {category.links.map((link, index) => (
            <a
              key={`${link.title}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: 16,
                background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,250,255,0.96))",
                padding: "24px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 4px 6px rgba(15,23,42,0.04)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(15,23,42,0.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(15,23,42,0.04)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {link.title}
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0A84FF",
                    background: "rgba(10,132,255,0.1)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {link.tag}
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {link.desc}
              </p>
              <div
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  marginTop: "auto",
                  wordBreak: "break-all",
                }}
              >
                {link.url}
              </div>
            </a>
          ))}
        </div>

        {/* 返回首页 */}
        <div
          style={{
            textAlign: "center",
            marginTop: 64,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "linear-gradient(135deg, #0A84FF 0%, #38BDF8 100%)",
              color: "white",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}