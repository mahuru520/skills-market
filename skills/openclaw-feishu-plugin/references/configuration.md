# 飞书插件配置指南

## 获取凭证

1. 打开飞书开放平台 `open.feishu.cn`
2. 创建新应用或选择已有应用
3. 获取 `App ID` 和 `App Secret`

## 配置文件位置

`~/.openclaw/openclaw.json`

## 基本配置

```json
{
  "env": {
    "FEISHU_APP_ID": "cli_xxxxxxxxxxxxxx",
    "FEISHU_APP_SECRET": "xxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxxxxxxxxxxxxx",
      "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

## 可选配置项

### 流式响应

```bash
# 启用
openclaw config set channels.feishu.streaming true

# 禁用
openclaw config set channels.feishu.streaming false
```

### 卡片底部信息

```bash
# 显示耗时
openclaw config set channels.feishu.footer.elapsed true

# 显示状态
openclaw config set channels.feishu.footer.status true
```

### 线程独立上下文

```bash
# 启用
openclaw config set channels.feishu.threadSession true

# 禁用
openclaw config set channels.feishu.threadSession false
```

### 群聊回复策略

```bash
# 仅@时回复（默认）
openclaw config set channels.feishu.requireMention true --json

# 回复所有消息（需 im:message.group_msg 权限）
openclaw config set channels.feishu.requireMention false --json

# 每群单独设置
openclaw config set channels.feishu.requireMention open --json
openclaw config set channels.feishu.groups.oc_xxxxxxxx.requireMention true --json
```

## 启动网关

```bash
# 启动
openclaw gateway

# 后台运行
nohup openclaw gateway > /dev/null 2>&1 &
```

## 重启网关

修改配置后需重启：

```bash
sh /workspace/projects/scripts/restart.sh
```

或手动重启：

```bash
# 停止现有进程
pkill -f openclaw

# 重新启动
openclaw gateway
```
