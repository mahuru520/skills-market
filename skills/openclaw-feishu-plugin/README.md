# OpenClaw 飞书插件安装

安装并配置 OpenClaw 飞书插件，实现飞书渠道接入。

## Overview

本技能提供飞书插件的安装、配置、验证与故障排查能力。

## Quick Start

```bash
# 1. 默认使用 npmmirror
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 2. 安装插件
npx -y @larksuite/openclaw-lark install

# 3. 配置凭证
# 编辑 ~/.openclaw/openclaw.json

# 4. 启动网关
openclaw gateway

# 5. 验证
npx @larksuite/openclaw-lark info
```

## Directory Structure

```
openclaw-feishu-plugin/
├── SKILL.md              # 主入口
├── README.md             # 本文件
└── references/
    ├── install.md        # 安装指南
    ├── configuration.md  # 配置指南
    ├── verification.md   # 验证指南
    ├── troubleshooting.md # 故障排查
    └── modules.md        # 能力模块
```

## 环境要求

- OpenClaw 2026.2.26+ (Linux/macOS) / 2026.3.2+ (Windows)
- Node.js 18+
- 飞书管理员账号

## When to Use

- **openclaw-feishu-plugin**: 飞书渠道接入
- **openclaw-qq-channel**: QQ 渠道接入
- **openclaw-dingtalk-channel**: 钉钉渠道接入
- **openclaw-wecom-channel**: 企业微信接入

## Verification

```bash
npx @larksuite/openclaw-lark doctor
openclaw status
```

确认 feishu 渠道显示 ON/OK。

## References

- `references/install.md` — 详细安装步骤
- `references/configuration.md` — 配置选项
- `references/verification.md` — 验证方法
- `references/troubleshooting.md` — 常见问题
- `references/modules.md` — 能力说明
