# 当前系统完整前端设计规划

> 更新时间：2026-06-13  
> 范围：Web 前台、Web 后台、游戏页、Expo Mobile 端规划、共享设计系统  
> 依据：`Frontend Responsive Design Standards`、当前代码与现有架构报告

## 1. 设计结论

Open-Source-Club-Nav 当前已经不是单纯的导航页，而是一个“社团门户 + 资源矩阵 + GitHub 活动看板 + 后台内容控制台”的综合系统。设计规划应保留当前科技感和社区属性，但必须把实现从“页面级特效堆叠”收敛成“可复用设计系统 + 移动优先布局 + 可运营后台”。

本次规划的核心方向：

- 前台首屏继续做实际可用的导航中枢，不做营销落地页。
- 后台转为高密度、低装饰、可重复操作的控制台。
- Mobile Web 优先保证完整可用，Expo App 后续承接原生体验，不假设当前 mobile 端已完成业务。
- 统一断点、尺寸、颜色、交互状态，减少页面内联样式和 JS 断点分叉。
- 所有新布局按 mobile-first 推进，再增强到 tablet、desktop、wide desktop。

## 2. 现状判断

### 2.1 已有优势

- Web 技术栈清晰：Next.js App Router、React、Tailwind CSS 4、lucide-react。
- 前台内容模块完整：资源矩阵、作品轮播、GitHub 动态、友链、小游戏、关于弹层。
- 后台已具备真实管理能力：链接管理、统计、健康检测、日志、用户管理。
- 已有 `data-ui-touch`、`prefers-reduced-motion`、主题变量和 mobile navigation 的基础。
- 资源矩阵已有数据契约文档，可作为前后台一致性的锚点。

### 2.2 主要设计债

- 断点体系不统一：JS 中使用 `<=768`、`<=1200`，CSS 中还有 `640`、`720`、`980`、`1080`、`1200` 等口径。
- 样式来源分散：大量内联 style、全局 CSS、Tailwind、CSS Module 混用，导致组件复用困难。
- 移动端信息优先级不够稳定：部分功能通过额外面板、滚动提示或 hover reveal 承载，手机上容易变成隐藏信息。
- 字号和触控尺寸不稳定：多处 8-12px 文本、32px/28px 控件，不满足长期移动端可读性和 44px 触控目标。
- 前台视觉偏沉重：深蓝、半透明面板、光效和 3D 动画较多，容易影响性能和内容扫描。
- 后台页面单文件复杂度高，视觉和交互规范还没有沉淀成组件。
- Expo Mobile 入口目前几乎为空，依赖和 polyfill 较重，应作为后续阶段单独设计。

## 3. 产品信息架构

### 3.1 对外前台

前台用户目标是快速找到资源、了解社团、查看项目与动态。

主结构：

- 首页中枢：社团品牌、关键数据、资源入口、作品入口、GitHub 动态入口。
- 资源矩阵：智库、校园、工具三类，支持后续扩展筛选、搜索、标签。
- 作品展示：项目卡片、贡献者、仓库链接、同步状态。
- 社团信息：使命、部门、章程、积分规则、开发团队。
- 小游戏：站内游戏体验和排行榜。
- 友链和外链：高校、社区、合作资源。

### 3.2 管理后台

后台用户目标是高效维护内容和观察运行状态。

主结构：

- 总览：访问、点击、访客、系统运行、异常提醒。
- 内容管理：资源矩阵、友链、小游戏、作品、文章或公告。
- 链接健康：异常列表、最近检测、手动检测。
- 日志审计：操作日志、登录审计、关键变更。
- 用户权限：super/editor 角色管理。
- 系统设置：环境、缓存、GitHub 同步状态。

### 3.3 Mobile App

当前 Mobile 端不应直接承诺完整业务。建议分两步：

- 第一阶段：Mobile Web 完整可用，PWA 级体验达标。
- 第二阶段：Expo App 复用 Web 的数据类型、服务层和设计 token，先做“资源浏览 + 活动通知 + 收藏/最近访问”，再扩展后台能力。

## 4. 响应式断点规划

采用 Tailwind 标准断点，减少自定义断点。

| 名称 | 宽度 | 设计含义 | 主要布局 |
| --- | --- | --- | --- |
| base | `<640px` | 手机默认 | 单列、底部安全区、sheet/drawer |
| sm | `>=640px` | 大手机/小平板 | 单列增强、2列卡片 |
| md | `>=768px` | 平板 | 两列内容、顶部/侧边辅助导航 |
| lg | `>=1024px` | 小桌面 | 中心工作区 + 辅助信息区 |
| xl | `>=1280px` | 桌面 | 左导航 + 中心内容 + 右动态 |
| 2xl | `>=1536px` | 大屏 | 增强留白和信息密度，不放大字体 |

迁移策略：

- 将 `<=1200` 的“mobile viewport”语义拆为 `tablet` 和 `desktop compact`。
- 左右固定面板只在 `xl` 及以上出现。
- `lg` 到 `xl` 之间不强行塞三栏，采用中心内容优先。
- 尽量用 CSS/Tailwind 控制布局，JS 只处理真实交互状态。
- 如确需读取断点，统一封装 `useBreakpoint()`，不在组件里散落 `window.innerWidth`。

## 5. 布局规划

### 5.1 前台首页

Mobile first：

- 顶部：紧凑 header，Logo、主题切换、菜单按钮，所有按钮 44x44。
- 首屏：社团名、核心状态 chips、资源矩阵入口优先展示。
- 资源：三类资源用 segmented control 或横向 tabs，内容单列卡片。
- 作品：从复杂轮播降级为可横滑/可分页卡片列表，避免手机上依赖 hover。
- 动态：默认折叠为“GitHub 动态”区块或底部 sheet，不占首屏主空间。
- 关于：全屏 dialog/sheet，目录变为顶部横向 tabs 或 sticky section nav。

Tablet：

- 首页中枢与资源卡片形成 2 列。
- 作品和动态可上下分区，不使用桌面侧栏。
- 关于弹层使用两栏：左目录、右正文。

Desktop：

- `xl` 起启用三栏 shell。
- 左侧：资源分类、友链、小游戏入口。
- 中间：社团中枢、资源内容、作品。
- 右侧：GitHub 活动和系统状态。
- 3D Globe 保留为品牌信号，但应可懒加载、可降级、可关闭动效。

### 5.2 资源矩阵

设计目标是“可扫描、可维护、可扩展”。

- 分类导航：智库、校园、工具固定为一级。
- 卡片字段：标题、描述、标签、来源域名、健康状态、外链图标。
- 移动端卡片高度稳定，描述最多 2-3 行。
- 桌面端支持 grid：`repeat(auto-fit, minmax(16rem, 1fr))`。
- 后台编辑字段应与前台展示字段一一对应。

### 5.3 后台控制台

后台视觉应比前台更安静，少用玻璃拟态和大型动画。

Mobile：

- 顶部 sticky toolbar，模块切换用横向 tabs 或 menu sheet。
- 表格转为 card list，每条显示主要字段和快捷操作。
- 创建/编辑表单用全屏 sheet，避免小屏内嵌复杂表单。

Tablet/Desktop：

- 左侧导航 + 顶部状态栏 + 主内容区。
- KPI 使用 2/4 列自适应。
- 内容管理主区采用“筛选栏 + 数据表 + 右侧/弹层编辑器”。
- 日志和健康检测支持状态筛选、时间筛选、批量刷新。

后台组件应优先沉淀：

- `AdminShell`
- `AdminSidebar`
- `AdminToolbar`
- `MetricCard`
- `DataTable`
- `ResponsiveRecordList`
- `EditorDrawer`
- `StatusBadge`
- `ConfirmDialog`

### 5.4 游戏页

游戏页可以更具表现力，但仍要稳定。

- 首屏直接进入游戏，不做介绍页。
- 手机端游戏棋盘使用固定 aspect-ratio，控件不挤压棋盘。
- 排行榜手机端放在游戏后方或底部 sheet。
- 键盘、鼠标、触屏操作提示放在紧凑提示块，不占主区域。

## 6. 视觉系统

### 6.1 设计语言

前台：现代开源社区中枢，科技感克制，强调真实内容和协作状态。  
后台：安静、清晰、可操作，优先扫描效率。  
游戏页：保留轻量趣味，但不影响可玩性。

### 6.2 色彩

建议从当前蓝/深色主题扩展为多色但克制的系统：

- 主色：OpenAtom Blue，用于主操作、链接、当前状态。
- 成功：Green，用于健康、上线、同步成功。
- 警告：Amber，用于待处理、性能、未检测。
- 危险：Red，用于异常、删除、登录失败。
- 中性色：Slate/Gray，用于文本、边框、后台底色。

规则：

- 不让页面被深蓝或单一蓝紫色统治。
- 文字对比满足 WCAG AA。
- 状态色同时配合文字/图标，不只靠颜色传达。

### 6.3 字体与字号

以可读性优先：

- 正文：`1rem`。
- 次级文字：`0.875rem`。
- 元信息/标签：最小 `0.75rem`，但不承载关键正文。
- 标题使用固定阶梯，不用 viewport width 缩放字体。
- 行高：正文 `1.5-1.7`，标题 `1.2-1.3`。
- 字间距默认 `0`，只有英文短标签允许少量正向 letter-spacing。

### 6.4 圆角、阴影、边框

- 普通卡片圆角控制在 `0.5rem`。
- 工具按钮、输入框、表格行保持 6-8px。
- Dialog/Sheet 可使用 12px，但避免嵌套卡片。
- 阴影只用于浮层、hover、drawer，不作为所有容器默认样式。

## 7. 组件与代码组织

### 7.1 建议目录

```text
frontend/apps/web/src/
  components/
    ui/                 # Button, Input, Badge, Dialog, Sheet, Tabs
    layout/             # AppShell, AdminShell, ResponsiveContainer
    home/               # 首页业务组件
    admin/              # 后台业务组件
    shared/             # 跨模块复用
  styles/
    tokens.css          # 颜色、间距、断点说明、语义变量
    utilities.css       # touch target、sr-only、scrollbar 等
  hooks/
    useBreakpoint.ts
    usePrefersReducedMotion.ts
  types/
    navigation.ts
    resources.ts
```

### 7.2 迁移原则

- 新组件优先使用 Tailwind utility + 少量 CSS Module。
- 复杂动画、主题变量和全局 reset 才进入 `globals.css`。
- 删除重复的内联 hover style，改为 class 和 data-state。
- 交互组件统一支持：loading、disabled、focus-visible、reduced-motion。
- 图标按钮优先使用 lucide-react，避免手写 SVG，特殊品牌图标除外。

## 8. 状态设计

所有主要模块必须有四类状态：

- Loading：骨架屏或轻量占位，不使用空白。
- Empty：明确说明当前没有内容，并给出后台操作入口或刷新动作。
- Error：显示失败原因和重试操作。
- Stale：数据可用但同步失败时，保留旧数据并提示更新时间。

适用模块：

- GitHub 活动
- 资源矩阵
- 作品展示
- 后台统计
- 链接健康检测
- 用户和日志列表

## 9. 可访问性与触控标准

必须满足：

- 交互目标最小 44x44。
- Dialog/Sheet 有 focus trap、Esc 关闭、返回焦点。
- Tabs、switch、menu 使用正确 aria。
- 手机端不依赖 hover 才能看到重要内容。
- 键盘可操作所有后台核心流程。
- 动效遵守 `prefers-reduced-motion`。
- 页面无横向滚动，无文本互相遮挡。

## 10. 性能规划

优先治理项：

- `GlobeCanvas`、复杂登录动画、小游戏逻辑按需加载。
- 页面不可见时暂停定时器、轮播、动画。
- GitHub 活动、贡献者头像和系统状态设置合理缓存。
- 后台表格避免一次渲染过重，必要时分页或虚拟滚动。
- 图片统一使用 Next/Image 或明确 width/height，Logo 和头像避免布局偏移。
- 首屏不等待非关键数据，资源和动态可分区加载。

## 11. 实施路线

### Phase 0：设计基建

- 定义断点、颜色、字号、间距、圆角 token。
- 建立 `ui/` 基础组件：Button、IconButton、Badge、Input、Tabs、Dialog、Sheet。
- 建立 `useBreakpoint()` 和 reduced motion hook。
- 整理全局 CSS，把页面专属样式迁出 `globals.css`。

### Phase 1：前台 Mobile-first 改造

- 重构首页 shell，不再用 `<=1200` 统一当 mobile。
- 资源矩阵改为 mobile 单列、tablet 双列、desktop 多列。
- 作品轮播增加移动端非 hover 交互。
- 关于弹层改为响应式 dialog/sheet。
- 3D 和动效增加懒加载与降级策略。

### Phase 2：后台控制台重构

- 拆分 `admin/page.tsx` 为 shell、导航、各业务 panel。
- 表格和移动 card list 统一数据展示组件。
- 内容编辑使用 drawer/dialog。
- 所有 destructive action 加确认状态。
- 后台视觉统一为低装饰控制台风格。

### Phase 3：游戏页与专项页面

- 固定棋盘比例和控件区。
- mobile 排行榜和游戏链接下移或 sheet 化。
- 增加可访问键盘焦点和触屏方向控件。

### Phase 4：Mobile App 设计落地

- 清理未使用依赖和 polyfill。
- 共享 Web types/services。
- 先实现资源浏览、作品列表、活动动态。
- 后续再评估登录态后台操作是否进入 App。

### Phase 5：视觉 QA 与验收

- 使用 Browser/Playwright 检查 375、414、768、1024、1440、1536。
- 检查无横向滚动、无重叠、无按钮文字溢出。
- 检查浅色/深色主题。
- 检查 reduced motion。
- 跑 lint、build 和关键交互 smoke test。

## 12. 验收标准

响应式：

- 375px、414px、768px、1024px、1440px 下无水平滚动。
- 主要文本不小于 14px，正文不小于 16px。
- 主要交互控件触控区域不小于 44px。
- 移动端所有桌面 hover 信息都有替代入口。

体验：

- 首页首屏能直接完成资源入口选择。
- 后台 3 次点击以内进入任一核心模块。
- 内容管理新增、编辑、删除、刷新都有明确反馈。
- 网络失败时不白屏，不丢失旧数据。

工程：

- 新增 UI 使用共享组件，不再复制内联按钮和卡片样式。
- 断点只来自 Tailwind 标准或统一 hook。
- 复杂页面组件单文件控制在可维护范围内。
- 样式域清楚：global 只放全局，module/utility 承载组件。

## 13. 优先级建议

最高优先级：

1. 统一断点与基础 UI token。
2. 修复 mobile 触控、字号、无 hover 替代入口。
3. 拆后台控制台，沉淀后台组件。
4. 懒加载 3D/动画和非关键数据。

中期优先级：

1. 前台资源矩阵搜索和标签筛选。
2. 后台表格能力增强：筛选、排序、分页。
3. 统一空态、错误态、加载态。
4. 组件文档或轻量 Storybook/preview 页面。

后期优先级：

1. Expo App 真实业务功能。
2. PWA 能力。
3. 视觉回归测试。
4. 更完整的设计 token 发布到 Web/Mobile 双端。
