---
name: openclaw-dingtalk-channel
description: 安装并配置 OpenClaw 钉钉连接器插件，用于钉钉渠道接入、凭证配置、网关验证与问题排查。
metadata:
  version: "1.0"
  category: channel-integration
triggers:
  - 钉钉接入
  - 钉钉插件安装
  - dingtalk connector
  - dingtalk-connector
  - DINGTALK_CLIENT_ID
  - DINGTALK_CLIENT_SECRET
  - AI Card
  - 钉钉机器人
---

# OpenClaw 钉钉插件安装

## Overview

用于安装并配置 DingTalk connector 插件，从而完成钉钉渠道接入、基础联调、状态验证与常见问题排查。

## Quick Start

```bash
# 1. 确认 Gateway 正常
openclaw gateway status

# 2. 默认使用 npmmirror
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 3. 安装插件
openclaw plugins install @dingtalk-real-ai/dingtalk-connector

# 4. 配置 ~/.openclaw/openclaw.json
# 参考 references/configuration.md

# 5. 重启网关
openclaw gateway restart

# 6. 验证插件已加载
openclaw plugins list
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次安装钉钉插件 | → Route A: Install |
| 需要配置 AppKey / AppSecret 与渠道参数 | → Route B: Configure |
| 需要验证插件是否正常工作 | → Route C: Verify |
| 安装失败、升级异常或消息无响应 | → Route D: Troubleshoot |
| 需要 AI Card、会话隔离、异步模式、多 Agent 等高级能力 | → Route E: Advanced |

## Route A: Install

### 环境要求

- OpenClaw Gateway 已安装并运行
- 建议 OpenClaw SDK 版本不低于 `2026.3.22+`
- 已有钉钉企业账号，可在钉钉开放平台创建内部应用

### 安装命令

```bash
# 默认使用 npmmirror
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# npm 安装（推荐）
openclaw plugins install @dingtalk-real-ai/dingtalk-connector

# Git 安装
openclaw plugins install https://github.com/DingTalk-Real-AI/dingtalk-openclaw-connector.git

# 升级插件
openclaw plugins update dingtalk-connector
```

### 本地开发安装

```bash
git clone https://github.com/DingTalk-Real-AI/dingtalk-openclaw-connector.git
cd dingtalk-openclaw-connector
npm install
openclaw plugins install -l .
```

See `references/install.md` for details.

## Route B: Configure

### 必要凭证

在钉钉开放平台创建内部应用后，记录：

1. `AppKey` → `clientId`
2. `AppSecret` → `clientSecret`

### 基本配置

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "channels": {
    "dingtalk-connector": {
      "enabled": true,
      "clientId": "dingxxxxxxxxx",
      "clientSecret": "your_app_secret"
    }
  },
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

### 平台侧要求

1. 打开 `https://open.dingtalk.com/`
2. 创建企业内部开发应用
3. 添加机器人能力
4. 消息接收模式选择 `Stream 模式`
5. 至少开通以下权限：
   - `Card.Streaming.Write`
   - `Card.Instance.Write`
   - `qyapi_robot_sendmsg`
6. 发布应用并保存 `AppKey` / `AppSecret`

See `references/configuration.md` for details.

## Route C: Verify

### 本地验证

```bash
openclaw plugins list
openclaw gateway status
openclaw logs --follow
```

### 联调验证

1. 在钉钉中向机器人发送 `你好`
2. 期望在约 10 秒内收到回复
3. 如启用了 AI Card，确认消息以卡片或流式形式返回
4. 如使用新会话命令，确认 `/new`、`/reset`、`/clear` 生效

See `references/verification.md` for details.

## Route D: Troubleshoot

### 常见问题

1. **插件安装失败**
   - 先确认已设置 `NPM_CONFIG_REGISTRY=https://registry.npmmirror.com`
   - 再重试安装

2. **Gateway 正常但钉钉无响应**
   - 检查插件列表
   - 检查 Stream 模式
   - 检查 AppKey / AppSecret

3. **出现 400 / 401 错误**
   - 检查凭证与应用发布状态
   - 检查 Gateway 认证配置和 chatCompletions endpoint

4. **旧版本升级后配置不生效**
   - 清理旧插件目录与旧配置节点后重新安装

See `references/troubleshooting.md` for details.

## Route E: Advanced

高级能力包括：

- AI Card 流式响应
- 会话与记忆隔离
- 异步模式
- 多 Agent 路由
- 富媒体、文件与音频支持
- 钉钉文档 API

See `references/capabilities.md` for details.

## Verification Checklist

- [ ] `openclaw plugins list` 可看到 `dingtalk-connector`
- [ ] `openclaw gateway status` 正常
- [ ] `gateway.http.endpoints.chatCompletions.enabled` 已启用
- [ ] 钉钉机器人已发布且为 `Stream 模式`
- [ ] 钉钉端可正常收发消息

## References

- `references/install.md` — 安装与升级指南
- `references/configuration.md` — 配置与权限说明
- `references/verification.md` — 验证与联调步骤
- `references/troubleshooting.md` — 常见问题与排障
- `references/capabilities.md` — 高级能力与特性说明
