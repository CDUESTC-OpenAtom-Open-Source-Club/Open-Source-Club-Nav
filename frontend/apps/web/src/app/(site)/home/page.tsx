"use client"
import React, { useState, useEffect } from "react";
import categories from "@/constants/categories";
import {
  EVENT_TYPE_LABELS,
  type ActivitySource,
  type GitHubActivity,
  type GitHubActivityResponse,
  type GitHubActivityType,
} from "@/data/githubActivity";
import {
  ChevronLeft,
  ChevronRight,
  GitFork,
  GitBranch,
  GitCommitHorizontal,
  CircleAlert,
  GitPullRequest,
  MessageSquareText,
  Plus,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

/**
 * 资料区仪表盘页面
 * 布局参考设计图：网格背景 + 2×2 卡片网格
 * 每张卡片内容使用占位符注释标注，后续替换为真实内容
 */
export default function Home() {
  // 样式 tailwindCSS
  const page = "relative min-h-screen font-sans";
  const section = "w-full px-4 sm:px-6 md:px-12 lg:px-16 py-8 md:py-10 min-h-[calc(100dvh-24px)] md:h-[calc(115vh)]";
  const grid = "min-h-0 grid grid-cols-1 md:grid-cols-5 grid-rows-2 gap-6 h-full";

  // 卡片通用
  const card = "bg-[#FAFBFC] backdrop-blur-sm rounded-2xl shadow-lg";
  const cardTitleRow = "flex items-center gap-2";
  const cardAccentBar = "w-1.5 h-5 bg-gradient-to-b from-yellow-400 to-amber-400 rounded-full flex-shrink-0";
  const cardTitle = "text-sm font-bold text-gray-800";

  // 卡片 1：媒体浏览区（左上）
  const card1 = `md:col-span-3 ${card} overflow-hidden flex flex-col`;
  const mediaArea = "relative flex-1 min-h-[260px] bg-gradient-to-br from-[#007AFF]/40 via-sky-300/50 to-blue-200/60 flex items-center justify-center";
  const mediaPlaceholderText = "text-white/70 text-sm font-medium tracking-wide";
  const arrowBtn = "absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white transition-colors flex items-center justify-center shadow";
  const arrowLeft = `left-3 ${arrowBtn}`;
  const arrowRight = `right-3 ${arrowBtn}`;
  const arrowIcon = "text-gray-700";
  const dotRow = "absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5";
  const dotActive = "block w-2 h-2 rounded-full transition-colors bg-white";
  const dotInactive = "block w-2 h-2 rounded-full transition-colors bg-white/40";
  const mediaBottom = "px-5 py-4 flex flex-col gap-2";
  const progressTrack = "w-full h-2 bg-gray-100 rounded-full overflow-hidden";
  const progressBar = "h-full w-2/5 bg-gradient-to-r from-yellow-400 to-amber-300 rounded-full";
  const mediaTitle = "text-sm font-bold text-gray-800";

  // 卡片 2：双层信息面板（右上）
  const card2 = `md:col-span-2 ${card} overflow-hidden flex flex-col divide-y divide-gray-100`;
  const panelBlock = "flex-1 px-5 py-5 flex flex-col gap-3";
  const panelContent = "flex-1 space-y-2";
  const skeletonSm = "skeleton-bar h-5 bg-gray-100 rounded-md w-full";
  // 社团概览：统计胶囊
  const statList = "md:grid md:grid-cols-2 gap-3 mt-1 flex flex-col w-fit";
  const statPill = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm w-fit";
  const statDot = "w-2 h-2 rounded-full flex-shrink-0";


  // 卡片 3：分类标签导航区（左下）
  const card3 = `min-h-0 md:col-span-3 ${card} px-6 py-5 flex flex-col gap-4`;
  const tagRow = "flex flex-wrap gap-2";
  const tagActiveStyle = "px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-[#007AFF] text-white shadow-sm";
  const tagInactiveStyle = "px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-sky-100 text-[#007AFF] hover:bg-sky-200";
  const contentGrid = "flex-1 grid grid-cols-2 gap-3 mt-1";

  // 分类内容卡片
  const itemCard = "flex flex-col justify-between bg-sky-50 hover:bg-sky-100 transition-colors rounded-xl px-4 py-3 cursor-pointer";
  const itemTitle = "text-sm font-semibold text-gray-800 truncate";
  const itemDesc = "text-xs text-gray-400 mt-1 truncate";
  const itemIcon = "text-[#007AFF] mb-1";

  // 当前激活的分类 index
  const [activeTab, setActiveTab] = useState(0);

  // 当前激活分类的数据
  const currentCategory = categories[activeTab];
  const CurrentIcon = currentCategory.icon;

  // 卡片 4：成员动态区（右下）
  const card4 = `min-h-0 md:col-span-2 ${card} px-5 py-5 flex flex-col gap-3 overflow-hidden`;
  const activityList = "min-h-0 flex-1 overflow-y-auto flex flex-col gap-2 pr-1";
  const activityCard = "flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0";
  const activityIconBox = "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0";
  const activityRight = "flex-1 min-w-0 flex flex-col gap-1";
  const activityTopRow = "flex items-center justify-between gap-2";
  const activityBadge = "text-[10px] font-bold px-2 py-0.5 rounded-full";
  const activityTimeText = "text-[10px] text-gray-400 flex-shrink-0";
  const activityDesc = "text-xs font-semibold text-gray-800 truncate";
  const activityBottomRow = "flex items-center gap-1.5 flex-wrap";
  const activityUserAvatar = "w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0";
  const activityUserName = "text-[10px] text-gray-500";
  const activityRepo = "text-[10px] text-gray-400";
  const activityBranch = "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500";
  const activityDetails = "flex flex-wrap gap-1 mt-1";
  const activityDetailPill = "text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200";
  const activityMetaPill = "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium";

  // 动作类型 → lucide 图标映射
  const actionIcons: Record<GitHubActivityType, React.ElementType> = {
    PushEvent: GitCommitHorizontal,
    PullRequestEvent: GitPullRequest,
    PullRequestReviewEvent: GitPullRequest,
    PullRequestReviewCommentEvent: MessageSquareText,
    CreateEvent: Plus,
    DeleteEvent: Trash2,
    IssuesEvent: CircleAlert,
    ReleaseEvent: Tag,
    ForkEvent: GitFork,
    WatchEvent: Star,
    IssueCommentEvent: MessageSquareText,
  };

  interface OrgStatsPayload {
    members: number | null;
    membersSource?: string;
    projects: number;
    stars: number;
    source: ActivitySource | string;
  }

  // 成员动态数据，从 /api/activities 拉取
  const [activities, setActivities] = useState<GitHubActivity[]>([]);

  // 社团概览统计，从 /api/org-stats 拉取
  const [orgStats, setOrgStats] = useState<OrgStatsPayload>({
    members: null,
    projects: 0,
    stars: 0,
    source: "mock",
  });

  const memberStatLabel =
    orgStats.membersSource === "github-unavailable" || orgStats.members === null
      ? "members unavailable"
      : `${orgStats.members} members`;

  useEffect(() => {
    fetch("/api/activities")
      .then((res) => {
        if (!res.ok) throw new Error(`请求失败 ${res.status}`);
        return res.json();
      })
      .then((data: GitHubActivityResponse) => {
        setActivities(Array.isArray(data.activities) ? data.activities : []);
      })
      .catch((err) => console.error("[activities] 获取失败：", err));
  }, []);

  useEffect(() => {
    fetch("/api/org-stats", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((data: OrgStatsPayload | null) => {
        if (data) setOrgStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <main className={page}>
      {/* ── 主内容区：2×2 卡片网格 */}
      <section className={section}>
        <div className={grid}>
          {/* ───────────────────────────────────────
              卡片 1：媒体浏览区（左上，占 3 列）
              功能：图片/视频轮播，带左右箭头导航，底部进度条 + 标题
          ─────────────────────────────────────── */}
          <div className={card1}>
            {/* 媒体展示区域（蓝色渐变占位，替换为真实轮播图片/视频） */}
            <div className={mediaArea}>
              <p className={mediaPlaceholderText}>
                [ banner占位区 ]
              </p>

              {/* 左侧导航箭头 */}
              <button className={arrowLeft}>
                {/* 占位：上一张/上一页 触发事件 */}
                <ChevronLeft size={20} className={arrowIcon} />
              </button>

              {/* 右侧导航箭头 */}
              <button className={arrowRight}>
                {/* 占位：下一张/下一页 触发事件 */}
                <ChevronRight size={20} className={arrowIcon} />
              </button>

              {/* 轮播指示点（底部居中） */}
              <div className={dotRow}>
                {/* 占位：根据媒体数量动态渲染指示点 */}
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={i === 0 ? dotActive : dotInactive} />
                ))}
              </div>
            </div>

            {/* 底部：金色进度条 + 标题 */}
            <div className={mediaBottom}>
              {/* 金色进度条（实际进度用 style={{ width: `${progress}%` }} 控制） */}
              <div className={progressTrack}>
                <div className={progressBar} style={{ width: `50%`}} />
              </div>
              <p className={mediaTitle}>[ 媒体标题占位 ]</p>
            </div>
          </div>

          {/* ───────────────────────────────────────
              卡片 2：双层信息面板（右上，占 2 列）
              功能：上下两块信息展示区，各带金色左侧强调条
          ─────────────────────────────────────── */}
          <div className={card2}>
            <div className={panelBlock}>
              <div className={cardTitleRow}>
                <span className={cardAccentBar} />
                {/* 官网API */}
                <h3 className={cardTitle}>[ 官网最新文章 ]</h3>
              </div>
              <div className={panelContent}>
                {/* 占位：时间线、日程、图表等内容 */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className={skeletonSm} />
                ))}
              </div>
            </div>
            <div className={panelBlock}>
              <div className={cardTitleRow}>
                <span className={cardAccentBar} />
                {/* githubAPI */}
                <h3 className={cardTitle}>[ 社团概览 ]</h3>
              </div>
              {/* 统计胶囊列：从上到下垂直排列 */}
              <div className={statList}>
                <span className={statPill}>
                  <span className={statDot} style={{ backgroundColor: "#3B82F6" }} />
                  {memberStatLabel}
                </span>
                <span className={statPill}>
                  <span className={statDot} style={{ backgroundColor: "#06B6D4" }} />
                  {orgStats.projects} projects
                </span>
                <span className={statPill}>
                  <span className={statDot} style={{ backgroundColor: "#F59E0B" }} />
                  {orgStats.stars >= 1000 ? (orgStats.stars / 1000).toFixed(1) + "k" : orgStats.stars} stars
                </span>
                <span className={statPill}>
                  <span className={statDot} style={{ backgroundColor: "#10B981" }} />
                  {orgStats.source === "github" ? "live from GitHub" : "year-round activity"}
                </span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────
              卡片 3：分类标签导航区（左下，占 3 列）
              功能：金色标题条 + 一排胶囊形分类 Tab 按钮
          ─────────────────────────────────────── */}
          <div className={card3}>
            <div className={cardTitleRow}>
              <span className={cardAccentBar} />
              <h3 className={cardTitle}>[ 资料分类 ]</h3>
            </div>

            {/* 胶囊分类 Tab 按钮行 */}
            <div className={tagRow}>
              {categories.map((cate, i) => (
                <button
                  key={cate.name}
                  onClick={() => setActiveTab(i)}
                  className={
                    activeTab === i ? tagActiveStyle : tagInactiveStyle
                  }
                >
                  {cate.name}
                </button>
              ))}
              {/* 查看更多未完成！！！！！ */}
            </div>

            {/* 当前激活分类的内容卡片 */}
            <div className={contentGrid}>
              {currentCategory.items.map((item) => (
                <div key={item.title} className={itemCard}>
                  <CurrentIcon size={14} className={itemIcon} />
                  <p className={itemTitle}>{item.title}</p>
                  <p className={itemDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ───────────────────────────────────────
              卡片 4：详情 / 附加信息区（右下，占 2 列）
              功能：金色标题条 + 正文内容区（如简介、统计、链接等）
          ─────────────────────────────────────── */}
          <div className={card4}>
            <div className={cardTitleRow}>
              <span className={cardAccentBar} />
              <h3 className={cardTitle}>[ 成员动态 ]</h3>
            </div>

            <div className={activityList}>
              {activities.map((item) => {
                const badgeText = EVENT_TYPE_LABELS[item.type] ?? "EVENT";
                const ActionIcon = actionIcons[item.type] ?? GitCommitHorizontal;
                const repoName = item.repo.split("/")[1] || item.repo;
                return (
                  <div key={item.id} className={activityCard}>
                    {/* 左侧：圆角方形动作图标 */}
                    <div
                      className={activityIconBox}
                      style={{ backgroundColor: `${item.color}14` }}
                    >
                      <ActionIcon size={18} color={item.color} />
                    </div>
                    {/* 右侧：内容区 */}
                    <div className={activityRight}>
                      {/* 第一行：动作徽章 + 时间 */}
                      <div className={activityTopRow}>
                        <span
                          className={activityBadge}
                          style={{
                            backgroundColor: `${item.color}14`,
                            color: item.color,
                          }}
                        >
                          {badgeText}
                        </span>
                        <span className={activityTimeText}>{item.time}</span>
                      </div>
                      {/* 第二行：描述（commit message 风格） */}
                      <p className={activityDesc}>{item.message}</p>
                      {item.details.length > 0 && (
                        <div className={activityDetails}>
                          {item.details.slice(0, 2).map((detail, index) => (
                            <span key={`${item.id}-detail-${index}`} className={activityDetailPill}>
                              {detail}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* 第三行：用户头像 · 用户名 · 仓库 + 可选分支 */}
                      <div className={activityBottomRow}>
                        <div
                          className={activityUserAvatar}
                          style={{ backgroundColor: item.color }}
                        >
                          {item.actor.avatar}
                        </div>
                        <span className={activityUserName}>{item.actor.login}</span>
                        <span className={activityRepo}>· {repoName}</span>
                        {item.branch && (
                          <span className={activityBranch}>
                            <GitBranch size={9} />
                            {item.branch}
                          </span>
                        )}
                        {item.commits > 0 && (
                          <span
                            className={activityMetaPill}
                            style={{
                              backgroundColor: `${item.color}12`,
                              color: item.color,
                            }}
                          >
                            {item.commits} commit{item.commits > 1 ? "s" : ""}
                          </span>
                        )}
                        {item.isMergedPr && (
                          <span
                            className={activityMetaPill}
                            style={{
                              backgroundColor: "#ECFDF5",
                              color: "#059669",
                            }}
                          >
                            merged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 骨架屏脉冲动画定义 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes skeleton-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
            .skeleton-bar {
              animation: skeleton-pulse 1.8s ease-in-out infinite;
            }
          `,
        }}
      />
    </main>
  );
}
