# 钉钉连接器配置指南

## 配置文件位置

`~/.openclaw/openclaw.json`

## 最小配置

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

## 可选配置项

| 配置项 | 说明 |
|--------|------|
| `gatewayToken` | Gateway 认证 token，可选 |
| `gatewayPassword` | Gateway 认证 password，与 token 二选一 |
| `separateSessionByConversation` | 是否按单聊/群聊/群区分 session |
| `groupSessionScope` | `group` 或 `group_sender` |
| `sharedMemoryAcrossConversations` | 不同会话间是否共享记忆 |
| `asyncMode` | 异步模式 |
| `ackText` | 异步模式回执文本 |

## 钉钉开放平台要求

1. 打开 `https://open.dingtalk.com/`
2. 进入「应用开发」→「企业内部开发」→ 创建应用
3. 添加机器人能力
4. 消息接收模式选择 `Stream 模式`
5. 至少开通以下权限：
   - `Card.Streaming.Write`
   - `Card.Instance.Write`
   - `qyapi_robot_sendmsg`
6. 发布应用并记录 `AppKey` 和 `AppSecret`

## Gateway 要求

必须启用 `chatCompletions` 端点，否则插件无法正常请求 Gateway。

## 重启网关

```bash
openclaw gateway restart
```
