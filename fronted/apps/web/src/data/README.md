# src/data 目录说明

这里存放静态数据和 mock 数据，是前台展示和接口降级的重要补充来源。

## 文件说明
- `works.ts`：作品静态数据
- `resources.ts`：资源导航数据
- `githubActivity.ts`：GitHub 动态 mock 数据与辅助配置

## 维护建议
- 如果接口已有真实数据源，这里的数据应尽量保持为 mock 或 fallback。
- 新增 mock 数据时，字段结构尽量与接口返回一致，减少前端分支处理。
- 如果后续要统一 mock 体系，可以从这里开始逐步收拢 route 内的静态数据。
