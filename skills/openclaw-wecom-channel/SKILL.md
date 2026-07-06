---
name: openclaw-wecom-channel
description: 将企业微信机器人接入 OpenClaw。触发条件：(1) 用户请求企业微信渠道接入 (2) 需要安装企业微信频道插件 (3) 需要配置 Bot ID/Secret 并验证连通
---

# OpenClaw 接入企业微信渠道

## 使用场景

- 在企业微信中启用 OpenClaw AI 对话
- 通过企业微信智能机器人进行消息交互

## 执行步骤

1. 在企业微信创建 API 模式机器人并获取 `Bot ID/Secret`
2. 安装企业微信频道插件（如 `npx -y @wecom/wecom-openclaw-cli install`）
3. 按提示填写凭证完成绑定
4. 验证机器人收发消息能力

## 验收标准

- 插件安装成功
- 凭证配置通过
- 企业微信端可正常与 OpenClaw 对话

## 详细手册

- `../../docs/技能用户手册/企业微信接入OpenClaw.md`
