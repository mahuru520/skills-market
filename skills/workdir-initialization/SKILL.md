---
name: workdir-initialization
description: 区分并初始化用户目录与系统工作目录。触发条件：(1) 用户请求设置初始目录 (2) 需要明确 /data/file 与 /root/.openclaw/workspace 的用途 (3) 需要更新 TOOLS.md 目录约定
---

# 初始目录区分与初始化

## 使用场景

- 区分用户目录与系统工作目录职责
- 统一后续文件读取与配置维护入口

## 执行步骤

1. 检查用户目录 `/data/file/` 当前目录结构
2. 更新 `/root/.openclaw/workspace/TOOLS.md`，写明目录约定
3. 验证用户文件操作优先使用 `/data/file/`，配置与技能维护使用 `/root/.openclaw/workspace/`

## 验收标准

- 配置文档明确两个目录及用途
- 用户文件检索与读取优先落在 `/data/file/`
- OpenClaw 配置与技能路径明确为 `/root/.openclaw/workspace/`

## 详细手册

- `../../docs/技能用户手册/初始化目录流程手册.md`
