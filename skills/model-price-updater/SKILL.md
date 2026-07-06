---
name: model-price-updater
description: 自动从 ospreyai.cn 获取模型价格并更新 OpenClaw 配置。用于维护最新的模型定价信息。
metadata:
  version: "1.0"
  category: configuration
  triggers:
    - 更新模型价格
    - model price
    - 价格调整
    - ospreyai pricing
---

# Model Price Updater

## Overview

自动更新 OpenClaw 配置中的模型价格，确保模型定价与 ospreyai.cn 保持同步。

## Quick Start

```bash
# 执行价格更新
node skills/model-price-updater/update-prices.js

# 重启 Gateway 使配置生效
gateway restart
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次运行价格更新 | → Route A: Execute Update |
| 查看支持哪些模型 | → Route B: List Supported Models |
| 添加定时任务 | → Route C: Schedule Task |
| 排查更新失败 | → Route D: Troubleshoot |

## Route A: Execute Update

### 执行更新

```bash
# 使用 Node.js 执行价格更新
node skills/model-price-updater/update-prices.js
```

### 配置说明

- 配置文件：`openclaw.json`
- 目标路径：`models.providers.ospreyai.models[].cost`
- 价格来源：手动维护的 PRICE_MAP（需与 https://open.ospreyai.cn/pricing 同步）

### 输出字段

每个模型更新后的 cost 结构：
```json
{
  "input": 1.80,
  "output": 6.48,
  "cacheRead": 0.90,
  "cacheWrite": 0.90
}
```

单位：$/M（每百万tokens）

## Route B: List Supported Models

当前支持的模型及价格：

| 模型 ID | 输入价格 | 输出价格 | Cache Read | Cache Write |
|---------|----------|----------|------------|-------------|
| minimax-m2.5 | $1.80/M | $6.48/M | $0.90/M | $0.90/M |
| glm-latest | $1.80/M | $1.62/M | $0.90/M | $0.90/M |
| minimax-m2 | $1.80/M | $1.80/M | $0.90/M | $0.90/M |
| minimax-latest | $2.00/M | $2.00/M | $1.00/M | $1.00/M |
| glm-4.7 | $1.80/M | $1.62/M | $0.90/M | $0.90/M |
| glm-4.6 | $2.00/M | $2.00/M | $1.00/M | $1.00/M |

## Route C: Schedule Task

### 添加每日定时任务

```bash
# 在 Gateway 中添加 cron 任务
cron add --name model-price-updater --schedule "0 0 * * *" --message "从 ospreyai.cn 获取最新模型价格"
```

### 定时任务说明

- **触发时间**：每天 00:00（午夜）
- **执行方式**：调用 `update-prices.js` 脚本
- **生效条件**：需要重启 Gateway

## Route D: Troubleshoot

### 常见问题

1. **未找到配置文件**
   - 检查 `openclaw.json` 是否存在于正确路径
   - 确认文件包含 `models.providers.ospreyai` 配置

2. **没有需要更新的模型**
   - 检查 PRICE_MAP 是否包含目标模型 ID
   - 确认模型 ID 与配置中的 id 字段一致

3. **权限错误**
   - 确保有写入 `openclaw.json` 的权限
   - 检查文件是否被其他进程锁定

### 验证清单

- [ ] 脚本执行无错误
- [ ] 输出显示已更新模型数量
- [ ] `openclaw.json` 中 cost 字段已更新
- [ ] Gateway 重启后新价格生效

## References

- `references/overview.md` — 功能概述与服务假设
- `references/pricing-source.md` — 价格数据来源说明
- `references/update-process.md` — 更新流程详解
- `references/troubleshooting.md` — 常见问题排查
