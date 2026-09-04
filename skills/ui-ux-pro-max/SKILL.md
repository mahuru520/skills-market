---
name: ui-ux-pro-max
description: "UI/UX Pro Max 技能包：本地可搜索设计知识库（84 种 UI 风格、192 套配色、74 组字体搭配、119 条 UX 准则、105 个图标、17 个 GSAP 预设、25 种图表、22 个技术栈规范）+ 一键设计系统生成器，含 7 个子技能。纯 Python 标准库实现，平台无关，可用于 Claude Code、OpenClaw、Codex 等任意 agent。设计、构建、评审界面时使用。"
---

# UI/UX Pro Max — 设计智能技能包

本地可搜索的 UI/UX 设计知识库 + 设计系统生成器。无网络依赖、无第三方依赖，任意 agent 平台可用。

## 包结构

| 子技能 | 用途 |
|---|---|
| ui-ux-pro-max | 主技能：BM25 检索（风格/配色/字体/UX 准则/图表/图标/GSAP）+ `--design-system` 一键生成完整设计系统 |
| design | 综合设计：logo、CIP 企业视觉、横幅、图标、社交图 |
| design-system | 设计令牌（primitive→semantic→component 三层）与幻灯片生成 |
| ui-styling | shadcn/ui + Tailwind 组件、主题、响应式与无障碍 |
| brand | 品牌规范、品牌资产管理与一致性检查 |
| slides | 战略型 HTML 演示文稿（Chart.js） |
| banner-design | 多平台横幅设计（社交/广告/网页/印刷） |

子技能位于包内 `skills/<name>/`，每个子技能自带 SKILL.md，脚本路径按「相对该 SKILL.md 所在目录」解析。

## 安装到不同 agent

技能内容平台无关：frontmatter 为标准 name/description；脚本仅依赖 Python 3 标准库，用 `__file__` 定位数据目录，可在任意工作目录运行。安装时把 `skills/` 下的 7 个子技能目录复制到对应平台的技能目录：

| 平台 | 目标目录 |
|---|---|
| Claude Code / OpenClaw | `.claude/skills/` |
| Codex / Antigravity / Universal | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |
| 其他 | 对应平台的 skills 目录 |

也可用上游 CLI 一键安装：`npx ui-ux-pro-max-cli init --ai <platform>`。

## 主技能快速开始

在子技能目录（ui-ux-pro-max/）下：

```bash
python scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"   # 生成设计系统
python scripts/search.py "error summary validation" --domain ux                    # 查 UX 准则
python scripts/search.py "suspense streaming bundle" --stack nextjs                # 查技术栈规范
```

主技能详细用法见 `skills/ui-ux-pro-max/SKILL.md`。
