export const pacmanMockLeaderboard = [
  {
    rank: 1,
    name: "Player One",
    score: 3280,
    level: 3,
    updatedAt: "待接入存档",
  },
  {
    rank: 2,
    name: "Debug Fox",
    score: 2760,
    level: 3,
    updatedAt: "待接入存档",
  },
  {
    rank: 3,
    name: "KCOS Neo",
    score: 2240,
    level: 2,
    updatedAt: "待接入存档",
  },
];

export const pacmanLeaderboardFields = [
  "player_name / 玩家昵称",
  "best_score / 最高分",
  "max_level / 最高关卡",
  "updated_at / 更新时间",
];

export const pacmanLeaderboardStoragePlans = [
  "当前使用前端模拟数据渲染排行榜界面",
  "后续可替换为 localStorage、IndexedDB 或后端 API",
  "可继续扩展周榜、总榜、个人历史记录",
];
