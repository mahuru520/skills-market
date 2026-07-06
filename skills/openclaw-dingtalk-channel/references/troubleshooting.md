# 钉钉连接器故障排查

## 安装失败

1. 确认默认 npm 镜像配置：

```bash
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
```

2. 重试安装：

```bash
openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```

## 机器人无响应

1. 确认 Gateway 正在运行
2. 确认机器人接收模式为 `Stream 模式`
3. 确认 `clientId` / `clientSecret` 正确
4. 检查应用是否已发布

## 400 错误

常见原因：

- 应用未发布
- 凭证错误
- 非 Stream 模式
- 设置了 IP 白名单

排查步骤：

1. 确认应用已发布
2. 确认机器人为 `Stream 模式`
3. 校验凭证是否包含空格或换行

## 401 错误

检查 `gateway.auth` 配置中的 token 或 password 是否正确。

## 405 错误

确认 `gateway.http.endpoints.chatCompletions.enabled` 已启用。

## 升级后配置不生效

清理旧插件目录与旧配置节点后重新安装：

```bash
rm -rf ~/.clawdbot/extensions/dingtalk-connector
rm -rf ~/.moltbot/extensions/dingtalk-connector
rm -rf ~/.openclaw/extensions/dingtalk-connector
openclaw plugins install @dingtalk-real-ai/dingtalk-connector
```

## 图片或附件处理异常

1. 检查媒体是否下载到 `~/.openclaw/workspace/media/inbound/`
2. 检查视觉模型或附件解析依赖是否可用
3. 查看日志中的媒体处理报错

## 代理或网络超时

在必须走代理的环境中，可设置：

```bash
export DINGTALK_FORCE_PROXY=true
```
