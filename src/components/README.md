# src/components 目录说明

这里存放首页主界面和部分共享区域的可复用组件。

## 主要组件
- `StartupSplash.tsx`：启动过渡动画
- `HUDHeader.tsx`：首页顶部区域
- `LeftPanel.tsx`：左侧资源与导航区
- `CentralHub.tsx`：中心主交互区域
- `RightPanel.tsx`：右侧信息区
- `WorksCarousel.tsx`：作品轮播区
- `GlobeCanvas.tsx`：视觉球体画布
- `AnimatedSphere.tsx`：球体动画辅助组件

## 维护建议
- 首页新增模块优先拆成组件，不建议继续堆进 `src/app/page.tsx`。
- 调整首页布局时要同时检查左右侧面板和中心区是否联动错位。
- `CentralHub.tsx` 与 `WorksCarousel.tsx` 状态较多，改动前建议先通读内部逻辑。
