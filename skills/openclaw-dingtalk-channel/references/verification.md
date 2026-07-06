# 钉钉连接器验证指南

## 本地检查

```bash
openclaw plugins list
openclaw gateway status
openclaw logs --follow
```

预期结果：

- 插件列表中能看到 `dingtalk-connector`
- Gateway 状态正常
- 日志中没有持续报错

## 钉钉端联调

1. 在钉钉中向机器人发送 `你好`
2. 期望在约 10 秒内收到回复
3. 如启用了 AI Card，确认卡片或流式消息显示正常

## 会话命令验证

用户可发送以下命令开启新会话：

- `/new`、`/reset`、`/clear`
- `新会话`、`重新开始`、`清空对话`

## 验收清单

- [ ] `openclaw plugins list` 中存在 `dingtalk-connector`
- [ ] `openclaw gateway status` 正常
- [ ] 钉钉端可正常收发消息
- [ ] 新会话命令生效
- [ ] 无 400 / 401 / 405 等错误
