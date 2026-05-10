// 成员动态测试数据
// 对接真实 API 后可删除此文件，由 /api/activities 返回数据

const activities = [
  {
    id: 1,
    action: "FORK",
    desc: "forked from: open-atom/core",
    user: "zhang-ming",
    userInitials: "ZM",
    userColor: "#FF6B9D",
    repo: "open-atom-web",
    branch: null,
    time: "5 小时前",
  },
  {
    id: 2,
    action: "PUSH",
    desc: "feat: add conflict detection algorithm",
    user: "lin-xiaoying",
    userInitials: "LX",
    userColor: "#007AFF",
    repo: "hackathon-2025",
    branch: "feat/detection",
    time: "2 分钟前",
  },
  {
    id: 3,
    action: "PUSH",
    desc: "perf: reduce bundle size by 35%",
    user: "chen-haoyu",
    userInitials: "CH",
    userColor: "#34C759",
    repo: "auto-checkin",
    branch: "main",
    time: "4 小时前",
  },
  {
    id: 4,
    action: "ISSUE",
    desc: "issue: login page crashes on mobile safari",
    user: "wang-siqi",
    userInitials: "WS",
    userColor: "#FF9500",
    repo: "course-parser",
    branch: null,
    time: "1 小时前",
  },
  {
    id: 5,
    action: "PR",
    desc: "PR: implement real-time notification system",
    user: "liu-jiahao",
    userInitials: "LJ",
    userColor: "#30D5C8",
    repo: "open-atom-web",
    branch: "feat/notify",
    time: "15 分钟前",
  },
  {
    id: 6,
    action: "FORK",
    desc: "forked from: github-stats/contrib-dash",
    user: "zhao-shiyu",
    userInitials: "ZS",
    userColor: "#AF52DE",
    repo: "contrib-dashboard",
    branch: null,
    time: "3 小时前",
  },
];

// 各动作类型对应的视觉配置
export const actionConfig = {
  FORK: {
    iconBg: "#FFF0F5",
    iconColor: "#FF6B9D",
    badgeBg: "#FFF0F5",
    badgeText: "#FF6B9D",
  },
  PUSH: {
    iconBg: "#EBF5FF",
    iconColor: "#007AFF",
    badgeBg: "#EBF5FF",
    badgeText: "#007AFF",
  },
  ISSUE: {
    iconBg: "#FFF8EE",
    iconColor: "#FF9500",
    badgeBg: "#FFF8EE",
    badgeText: "#FF9500",
  },
  PR: {
    iconBg: "#E6FAF8",
    iconColor: "#30D5C8",
    badgeBg: "#E6FAF8",
    badgeText: "#30D5C8",
  },
};


export default activities;



