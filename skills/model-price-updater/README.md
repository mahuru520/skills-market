# Model Price Updater

自动更新 OpenClaw 配置中的模型价格，确保模型定价与 ospreyai.cn 保持同步。

## Overview

本技能用于维护 OpenClaw 配置文件的模型定价信息，支持手动触发和定时任务两种方式。

## Quick Start

```bash
# 执行价格更新
node skills/model-price-updater/update-prices.js

# 重启 Gateway 使配置生效
gateway restart
```

## Directory Structure

```
model-price-updater/
├── SKILL.md
├── README.md
├── update-prices.js
├── update-prices.sh
└── references/
    ├── overview.md
    ├── pricing-source.md
    ├── update-process.md
    └── troubleshooting.md
```

## When to Use

- **model-price-updater**：更新模型价格、同步定价配置
- 配合 **Gateway** 重启使新价格生效

## Supported Models

| 模型 ID | 输入价格 | 输出价格 |
|---------|----------|----------|
| minimax-m2.5 | $1.80/M | $6.48/M |
| glm-latest | $1.80/M | $1.62/M |
| minimax-m2 | $1.80/M | $1.80/M |
| minimax-latest | $2.00/M | $2.00/M |
| glm-4.7 | $1.80/M | $1.62/M |
| glm-4.6 | $2.00/M | $2.00/M |

## Verification

- 脚本执行成功，无错误输出
- 控制台显示已更新模型数量
- `openclaw.json` 中 cost 字段已正确更新
- Gateway 重启后新价格生效

## References

- `SKILL.md` — 完整技能文档
- `references/overview.md`
- `references/pricing-source.md`
- `references/update-process.md`
- `references/troubleshooting.md`
