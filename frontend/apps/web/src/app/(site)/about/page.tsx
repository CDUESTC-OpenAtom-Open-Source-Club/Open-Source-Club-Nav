import Link from "next/link";
import { SITE_URL, SITE_GITHUB_URL, SITE_OFFICIAL_URL } from "@/lib/site";

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        padding: "32px 16px 64px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* 面包屑导航 */}
        <nav aria-label="面包屑" style={{ marginBottom: 24 }}>
          <ol
            style={{
              display: "flex",
              gap: 8,
              fontSize: 14,
              color: "#64748b",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <li>
              <Link href="/" style={{ color: "#3b82f6", textDecoration: "none" }}>
                首页
              </Link>
            </li>
            <li>/</li>
            <li style={{ color: "#0f172a" }}>关于我们</li>
          </ol>
        </nav>

        {/* 页面标题 */}
        <header style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 12px",
            }}
          >
            关于 KCOS 开放原子开源社团
          </h1>
          <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7, margin: 0 }}>
            科成开放原子开源社团（KCOS）是成都理工大学工程技术学院的学生开源社区，
            致力于推动高校开源文化建设，为学生开发者提供优质的学习资源与实践平台。
          </p>
        </header>

        {/* 使命 */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>我们的使命</h2>
          <p style={paragraphStyle}>
            KCOS 以「开放、协作、共享」为核心理念，通过汇集开源工具、学习资源和校园服务，
            帮助高校学生快速入门开源世界，培养工程实践能力与团队协作精神。
            我们相信开源不仅是技术，更是一种推动创新的协作方式。
          </p>
        </section>

        {/* 我们做什么 */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>我们做什么</h2>
          <div style={{ display: "grid", gap: 16 }}>
            {[
              {
                title: "开源导航平台",
                desc: "精选开发工具、学习资源、校园服务，一站式导航帮助同学高效获取所需资源。",
              },
              {
                title: "技术分享与交流",
                desc: "定期举办技术沙龙、Workshop 和开源项目实践，促进社团成员间的知识共享。",
              },
              {
                title: "开源项目贡献",
                desc: "鼓励成员参与开源项目，从 Issue 到 Pull Request，在实战中提升技术能力。",
              },
              {
                title: "校园开源文化推广",
                desc: "通过活动和宣传，在校园内推广开源理念，让更多同学了解和参与开源社区。",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 资源分类 */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>平台资源分类</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <Link href="/resources/intelligence" style={resourceLinkStyle}>
              <span style={{ fontWeight: 700, color: "#0A84FF" }}>智库 Intelligence</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                CS 自学路线、在线课程、算法刷题、学术论文等学习资源
              </span>
            </Link>
            <Link href="/resources/surface" style={resourceLinkStyle}>
              <span style={{ fontWeight: 700, color: "#06E5CC" }}>校园 Campus Atlas</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                教务系统、图书馆、校园卡、就业信息等校园服务导航
              </span>
            </Link>
            <Link href="/resources/armory" style={resourceLinkStyle}>
              <span style={{ fontWeight: 700, color: "#7C3AED" }}>工具 Toolbox</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                GitHub、VS Code、Docker、Figma 等开发者必备工具
              </span>
            </Link>
          </div>
        </section>

        {/* 联系与链接 */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>加入我们</h2>
          <p style={paragraphStyle}>
            欢迎对开源感兴趣的同学加入 KCOS！你可以通过以下方式参与：
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            <a
              href={SITE_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={linkButtonStyle}
            >
              GitHub 仓库
            </a>
            <a
              href={SITE_OFFICIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={linkButtonStyle}
            >
              社团官网
            </a>
            <Link href="/" style={linkButtonStyle}>
              返回导航首页
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: 16,
  padding: "24px 28px",
  marginBottom: 24,
};

const headingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 12px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#475569",
  lineHeight: 1.7,
  margin: 0,
};

const resourceLinkStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "14px 18px",
  border: "1px solid rgba(191,219,254,0.8)",
  borderRadius: 10,
  textDecoration: "none",
  background: "rgba(255,255,255,0.85)",
};

const linkButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid rgba(59,130,246,0.3)",
  background: "rgba(59,130,246,0.08)",
  color: "#1d4ed8",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};
