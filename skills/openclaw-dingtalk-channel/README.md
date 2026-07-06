# OpenClaw 钉钉插件安装

安装并配置 OpenClaw DingTalk connector 插件，实现钉钉渠道接入。

## Overview

本技能提供钉钉连接器插件的安装、配置、验证、排障与能力说明。

## Quick Start

```bash
# 1. 检查 Gateway 状态
openclaw gateway status

# 2. 默认使用 npmmirror
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 3. 安装插件
openclaw plugins install @dingtalk-real-ai/dingtalk-connector

# 4. 配置 ~/.openclaw/openclaw.json

# 5. 重启网关
openclaw gateway restart

# 6. 验证
openclaw plugins list
```

## Directory Structure

```
openclaw-dingtalk-channel/
├── SKILL.md                # 主入口
├── README.md               # 本文件
└── references/
    ├── install.md          # 安装与升级
    ├── configuration.md    # 配置与权限
    ├── verification.md     # 验证与联调
    ├── troubleshooting.md  # 故障排查
    └── capabilities.md     # 高级能力
```

## 环境要求

- OpenClaw Gateway 已安装并运行
- 建议 OpenClaw SDK 版本不低于 `2026.3.22+`
- 钉钉企业账号与管理员权限

## When to Use

- **openclaw-dingtalk-channel**: 钉钉渠道接入
- **openclaw-feishu-plugin**: 飞书渠道接入
- **openclaw-qq-channel**: QQ 渠道接入
- **openclaw-wecom-channel**: 企业微信渠道接入

## Verification

```bash
openclaw plugins list
openclaw gateway status
openclaw logs --follow
```

确认 `dingtalk-connector` 已加载，且钉钉侧可正常收发消息。

## References

- `references/install.md` — 详细安装步骤
- `references/configuration.md` — 配置选项与平台要求
- `references/verification.md` — 联调与验证方法
- `references/troubleshooting.md` — 常见问题
- `references/capabilities.md` — 能力说明
