# src/components 目录说明

这里存放可复用组件，当前首页主界面组件统一归纳在 `home/`。

## 主要组件
- `home/StartupSplash.tsx`：启动过渡动画
- `home/HUDHeader.tsx`：首页顶部区域
- `home/LeftPanel.tsx`：左侧资源与导航区
- `home/CentralHub.tsx`：中心主交互区域
- `home/RightPanel.tsx`：右侧信息区
- `home/WorksCarousel.tsx`：作品轮播区
- `home/GlobeCanvas.tsx`：视觉球体画布
- `home/AnimatedSphere.tsx`：球体动画辅助组件
- `home/index.ts`：首页组件统一导出口

## 维护建议
- 首页新增模块优先拆成组件，不建议继续堆进 `src/app/(site)/page.tsx`。
- 调整首页布局时要同时检查左右侧面板和中心区是否联动错位。
- `home/CentralHub.tsx` 与 `home/WorksCarousel.tsx` 状态较多，改动前建议先通读内部逻辑。
