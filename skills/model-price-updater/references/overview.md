# Overview

## 功能概述

Model Price Updater 技能用于自动更新 OpenClaw 配置文件中的模型价格，确保模型定价与 ospreyai.cn 保持同步。

## 服务假设

- **配置文件路径**：`openclaw.json`（位于项目根目录或 `G:/xiaoyi_u_claw/data/.openclaw/`）
- **价格数据来源**：手动维护的 PRICE_MAP（需定期与 https://open.ospreyai.cn/pricing 同步）
- **目标配置路径**：`models.providers.ospreyai.models[].cost`

## 能力范围

| 能力 | 说明 |
|------|------|
| 价格更新 | 批量更新多个模型的输入/输出价格 |
| Cache 价格 | 同时更新 cacheRead 和 cacheWrite 价格 |
| 手动触发 | 通过 Node.js 脚本手动执行 |
| 定时任务 | 支持通过 cron 添加定时任务 |

## 限制

- 价格数据需要手动维护，无法自动抓取网页
- 仅支持 ospreyai provider 下的模型
- 更新后需要重启 Gateway 才能生效
