# 钉钉连接器安装指南

## 环境要求

- OpenClaw Gateway 已安装并运行
- 建议 OpenClaw SDK 版本不低于 `2026.3.22+`
- 可访问钉钉开放平台并创建内部应用

## 基本安装

```bash
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```

## Git 安装

```bash
openclaw plugins install https://github.com/DingTalk-Real-AI/dingtalk-openclaw-connector.git
```

## 本地开发安装

```bash
git clone https://github.com/DingTalk-Real-AI/dingtalk-openclaw-connector.git
cd dingtalk-openclaw-connector
npm install
openclaw plugins install -l .
```

## 升级插件

```bash
openclaw plugins update dingtalk-connector
```

## 国内网络安装失败时

```bash
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```

如已半安装：

```bash
cd ~/.openclaw/extensions/dingtalk-connector
rm -rf node_modules package-lock.json
NPM_CONFIG_REGISTRY=https://registry.npmmirror.com npm install
```

## 旧版本升级提示

如果之前安装过旧版本 connector，升级后可能出现插件加载异常或配置不生效。建议先清理旧目录：

```bash
rm -rf ~/.clawdbot/extensions/dingtalk-connector
rm -rf ~/.moltbot/extensions/dingtalk-connector
rm -rf ~/.openclaw/extensions/dingtalk-connector
openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```
