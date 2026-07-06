---
name: openclaw-qq-channel
description: 将 QQ 机器人接入 OpenClaw。触发条件：(1) 用户请求 QQ 渠道接入 (2) 需要配置 AppID/AppSecret (3) 需要验证 QQ 机器人消息收发
---

# OpenClaw 接入 QQ 渠道

## 使用场景

- 在 QQ 开放平台创建并接入机器人
- 在 OpenClaw 中安装 QQBot 插件并配置凭证
- 验证 QQ 端与 OpenClaw 双向通信

## 执行步骤

1. 在 QQ 开放平台创建 QQBot 并获取 `AppID/AppSecret`
2. 安装插件：`openclaw plugins install @tencent-connect/openclaw-qqbot@latest`
3. 添加渠道：`openclaw channels add --channel qqbot --token "AppId:AppSecret"`
4. 重启网关：`openclaw gateway restart`
5. 在 QQ 客户端中进行对话验证

## 验收标准

- 插件安装成功并已加载
- 渠道配置成功、无鉴权错误
- QQ 端可正常收发 AI 对话消息

## 详细手册

- `../../docs/技能用户手册/OpenClaw快速接入QQ指南.md`
