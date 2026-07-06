---
name: openclaw-ui-customization
description: 定制 OpenClaw 控制台 UI 品牌元素。触发条件：(1) 用户请求替换 Logo 或 favicon (2) 用户请求修改控制台标题 (3) 需要重建前端产物
---

# OpenClaw UI 定制

## 使用场景

- 替换 favicon 与品牌 Logo
- 修改控制台页面标题与左上角品牌文案
- 进行企业化定制部署

## 执行步骤

1. 准备 logo 资源并转换为 SVG
2. 替换 `/app/ui/public/favicon.svg` 与产物目录中的 favicon
3. 修改 UI 源码中的品牌标题和页面 `<title>`
4. 在 UI 目录执行构建并验证展示效果

## 验收标准

- 浏览器标签页图标更新
- 页面品牌标题更新
- 刷新后仍保持定制结果（构建产物已更新）

## 详细手册

- `../../docs/技能用户手册/OpenClaw定制UI手册.md`
