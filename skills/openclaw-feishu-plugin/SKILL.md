---
name: openclaw-feishu-plugin
description: 安装并配置 OpenClaw 飞书插件，用于飞书渠道接入、凭证配置、状态验证与问题排查。
metadata:
  version: "1.0"
  category: channel-integration
triggers:
  - 飞书接入
  - 飞书插件安装
  - feishu plugin
  - feishu-plugin-onboard
  - FEISHU_APP_ID
  - FEISHU_APP_SECRET
---

# OpenClaw 飞书插件安装

## Overview

用于安装飞书插件、配置 OpenClaw 与飞书应用凭证，并完成状态验证与故障排查。

## Quick Start

```bash
# 1. 检查环境
npx @larksuite/openclaw-lark doctor

# 2. 默认使用 npmmirror
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 3. 安装插件
npx -y @larksuite/openclaw-lark install

# 4. 配置凭证（如需要）
# 参考 references/configuration.md

# 5. 验证安装
npx @larksuite/openclaw-lark info

# 6. 启动网关
openclaw gateway
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次安装飞书插件 | → Route A: Install |
| 需要配置凭证与渠道 | → Route B: Configure |
| 需要确认是否安装成功 | → Route C: Verify |
| 安装失败或状态异常 | → Route D: Troubleshoot |

## Route A: Install

### 环境要求

- OpenClaw 已安装并运行（版本要求：Linux/macOS 2026.2.26+，Windows 2026.3.2+）
- Node.js 18+ 和 npm
- 飞书管理员账号（用于创建应用）

### 安装命令

```bash
# 默认使用 npmmirror
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 安装插件
npx -y @larksuite/openclaw-lark install

# 如失败，尝试 sudo
sudo npx -y @larksuite/openclaw-lark install
```

### 安装过程

1. 选择「创建新机器人」或「绑定已有机器人」
2. 如创建新机器人：当终端显示二维码后，必须将二维码的 ASCII Art 形式保存到用户目录下的 `feishu-install-qr.txt`
3. 这是飞书插件安装的重要要求，必须输出以下提示文案：

   ```
   ✅ 二维码已保存到用户目录：/data/file/feishu-install-qr.txt
   请按步骤操作：
   1 打开 /data/file/feishu-install-qr.txt 文件
   2 用飞书 APP 扫描其中的二维码
   3 在飞书中打开机器人
   ```

4. 完成创建后，在飞书打开机器人
5. 发送任意消息开始交互
6. 推荐执行：
   ```
   /feishu auth  # 批量授权用户
   ```

### 更新插件

```bash
npx -y @larksuite/openclaw-lark update
```

See `references/install.md` for details.

## Route B: Configure

### 必要凭证

获取飞书应用凭证：
1. 打开飞书开放平台 `open.feishu.cn`
2. 创建或选择已有应用
3. 获取 `App ID` 和 `App Secret`

### 配置文件

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "FEISHU_APP_ID": "请填写您的App ID",
    "FEISHU_APP_SECRET": "请填写您的App Secret"
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "请填写您的App ID",
      "appSecret": "请填写您的App Secret"
    }
  }
}
```

### 可选配置

```bash
# 流式响应
openclaw config set channels.feishu.streaming true

# 线程独立上下文
openclaw config set channels.feishu.threadSession true

# 群聊回复策略（仅@时回复）
openclaw config set channels.feishu.requireMention true --json

# 群聊回复策略（回复所有）
openclaw config set channels.feishu.requireMention false --json
```

See `references/configuration.md` for details.

## Route C: Verify

### CLI 验证

```bash
# 检查插件信息
npx @larksuite/openclaw-lark info

# 完整信息
npx @larksuite/openclaw-lark info --all

# 诊断检查
npx @larksuite/openclaw-lark doctor

# 自动修复
npx @larksuite/openclaw-lark doctor --fix
```

### 飞书端验证

```bash
# 在飞书发送
/feishu start
# 返回版本信息 = 成功

/feishu doctor
# 检查配置健康

/feishu auth
# 批量授权
```

### OpenClaw 状态

```bash
openclaw status
# 确认 feishu 渠道显示 ON/OK
```

See `references/verification.md` for details.

## Route D: Troubleshoot

### 常见问题

1. **安装失败**
   - 先确认默认 npm 镜像配置仍为：
     ```bash
     export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
     ```
   - 重试安装

2. **找不到模块**
   - 运行 `npm install` 在插件目录

3. **权限不足**
   - 导入权限清单并重新发布应用
   - 参考 `references/troubleshooting.md`

4. **状态异常**
   - 运行诊断命令
   - 检查配置文件

See `references/troubleshooting.md` for full guide.

## Verification Checklist

- [ ] `npx @larksuite/openclaw-lark info` 可运行
- [ ] `npx @larksuite/openclaw-lark doctor` 无错误
- [ ] `openclaw status` 显示 `feishu` 已启用
- [ ] 飞书端 `/feishu start` 返回版本信息
- [ ] 飞书端可正常触发 AI 能力

## References

- `references/install.md` — 安装指南
- `references/configuration.md` — 配置指南
- `references/verification.md` — 验证指南
- `references/troubleshooting.md` — 故障排查
- `references/modules.md` — 插件能力模块
