---
name: user-initialization
description: 用户初始化技能。用于首次使用时完成目录设置、掌握技能扩展规则，并快速了解本项目技能清单。触发条件：(1) 新用户首次接入 (2) 需要设置用户目录与系统目录 (3) 用户希望了解或更新可用技能
---

# 用户初始化技能

## 目标

帮助用户在第一次使用时完成三件事：

1. 明确并设置目录约定
2. 默认安装初始化必备技能
3. 学会技能扩展规则
4. 查看并按需更新本项目技能清单

## 初始化目录约定（必须先完成）

| 目录 | 路径 | 用途 |
|------|------|------|
| 您的目录/用户目录 | `/data/file/` | 用户文件存储、文件读写入口 |
| 系统目录/工作目录 | `/root/.openclaw/workspace/` | OpenClaw 配置与技能管理 |

执行要点：

1. 优先把“我的目录/用户目录”绑定到 `/data/file/`
2. 在 `/root/.openclaw/workspace/TOOLS.md` 中记录目录约定
3. 后续涉及用户文件时默认从 `/data/file/` 开始

## AI 行为准则配置（建议执行）

在 `/root/.openclaw/workspace/SOUL.md` 中追加以下行为准则：

```
**When something fails, find the working method first.**

Before trying different approaches:
1. Check for existing skill docs / manuals
2. Check server capabilities (models, nodes)
3. Use previously verified methods
4. Don't repeat what already failed
```

执行方式：直接编辑 `SOUL.md` 文件，将上述内容追加到文件末尾。

## 默认安装技能（建议作为初始化标准动作）

在执行用户初始化时，默认安装以下技能：

1. `workdir-initialization` — 初始化用户目录与系统工作目录约定
2. `skill-expansion` — 建立技能扩展来源优先级与安装规则
3. `self-improving-agent` — 建立持续记录学习、错误和修正的机制

执行要求：

1. 将上述技能复制或安装到 `~/.openclaw/workspace/skills/`
2. 重新读取技能目录，确认三项技能均可用
3. 若缺失任一技能，优先从本仓库补齐后再继续后续初始化流程

## 技能扩展规则（用户必须理解）

当现有技能无法满足需求时，按以下优先级扩展：

1. GitLab 仓库：`https://gitlab.ospreyai.cn/openclaw/xiaoyi_tools`
2. 本仓库离线资源：`packages/` 与 `tools/`
3. 本地自定义技能目录
4. OpenClaw 官方 skill hub

扩展流程：

1. 检查是否已有可复用技能
2. 下载/复制技能到 `~/.openclaw/workspace/skills/`
3. 重新读取并验证技能可用

## 当前项目技能清单（标准 skill）

| skill | 主要功能 |
|---|---|
| `comfyui-image-generation` | ComfyUI 文生图（提交工作流、查队列、下图片） |
| `comfyui-video-generation` | ComfyUI 图生视频（上传图片、生成并下载 mp4） |
| `md-to-pdf` | Markdown 转 PDF（含离线安装包兜底） |
| `minimax-docx` | DOCX 文档创建、编辑与排版 |
| `minimax-pdf` | 高质量 PDF 生成、填充与重排 |
| `minimax-xlsx` | Excel / 电子表格读取、创建、编辑与校验 |
| `pptx-generator` | PowerPoint 演示文稿生成、编辑与读取 |
| `problem-solving-debug` | 问题排查与根因分析 |
| `openclaw-ui-customization` | OpenClaw UI 定制（Logo、favicon、标题） |
| `openclaw-qq-channel` | QQ 机器人渠道接入 |
| `openclaw-dingtalk-channel` | 钉钉机器人渠道接入 |
| `openclaw-feishu-plugin` | 飞书插件安装与配置 |
| `openclaw-wecom-channel` | 企业微信机器人接入 |
| `workdir-initialization` | 用户目录与系统目录初始化 |
| `skill-expansion` | 技能扩展规则与来源优先级 |
| `user-initialization` | 首次使用初始化（本技能） |
| `self-improving-agent` | 持续自改进：记录学习、错误和修正 |

## 技能清单自动更新建议

当技能目录有新增/删除时，执行以下刷新策略：

1. 重新扫描 `skills/*/SKILL.md`
2. 按目录名重建技能清单（避免手工遗漏）
3. 若清单有变化，更新本文件中的“当前项目技能清单”

建议在以下时机触发刷新：

- 新增或删除任意 skill 目录后
- 版本发布前
- 用户明确要求“同步最新技能列表”时

## 验收标准

- 用户能说清两个目录及用途
- 默认技能 `workdir-initialization`、`skill-expansion`、`self-improving-agent` 已安装可用
- 用户知道技能扩展优先级与安装路径
- 技能清单与 `skills/*/SKILL.md` 实际结果一致
