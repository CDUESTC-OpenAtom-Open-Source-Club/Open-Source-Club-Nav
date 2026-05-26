// ============这里是测试数据不是真实数据！！===========

import {
  FileText,
  BookOpen,
  Wrench,
  Star,
  Users,
} from "lucide-react";

// 分类数据：每个分类对应一组资料条目
const categories = [
  {
    name: "学习资料",
    icon: BookOpen,
    items: [
      { title: "Git 入门指南", desc: "版本控制基础教程" },
      { title: "Linux 常用命令", desc: "终端操作速查手册" },
      { title: "数据结构与算法", desc: "配套练习题资源" },
    ],
  },
  {
    name: "开源项目",
    icon: Star,
    items: [
      { title: "社团官网源码", desc: "施工中" },
      { title: "自动化签到脚本", desc: "施工中" },
      { title: "开源贡献指引", desc: "如何给开源项目 PR" },
    ],
  },
  {
    name: "技术文章",
    icon: FileText,
    items: [
      { title: "浅谈前后端分离", desc: "架构设计入门" },
      { title: "Docker 容器化实践", desc: "部署环境一键搭建" },
      { title: "API 设计", desc: "接口规范与最佳实践" },
    ],
  },
  {
    name: "活动回顾",
    icon: Users,
    items: [
      { title: "2026 Qclaw活动", desc: "优秀文章回顾" },
      { title: "新生见面会", desc: "2026 秋季纳新" },
      { title: "社团换届", desc: "2026 社团换届" },
    ],
  },
  {
    name: "工具推荐",
    icon: Wrench,
    items: [
      { title: "VS Code 插件合集", desc: "效率提升必备" },
      { title: "AI工具推荐", desc: "现代编程必备" },
      { title: "在线工具箱", desc: "快速查询工具" },
    ],
  },
];

export default categories;
