# 飞书插件故障排查

## 安装失败

### 问题：安装命令失败

**解决方案**：

1. 确认默认 npm 镜像配置
   ```bash
   export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
   ```

2. 重新安装
   ```bash
   npx -y @larksuite/openclaw-lark install
   ```

3. 如仍失败，尝试 sudo
   ```bash
   sudo npx -y @larksuite/openclaw-lark install
   ```

### 问题：找不到模块

**原因**：依赖安装不完整

**解决方案**：
```bash
cd ~/.openclaw/plugins/feishu-plugin-onboard
npm install
```

## 状态异常

### 问题：feishu 渠道未启用

**诊断**：
```bash
npx @larksuite/openclaw-lark doctor
```

**解决**：
1. 检查配置文件
2. 重启网关
3. 重新运行 `npx @larksuite/openclaw-lark install`

### 问题：credentials 错误

**诊断**：
```bash
npx @larksuite/openclaw-lark info
```

**解决**：
1. 确认 App ID 和 App Secret 正确
2. 检查配置文件格式
3. 重启网关

## 权限问题

### 问题：权限不足

**解决**：

1. 打开飞书开放平台 `open.feishu.cn`
2. 进入「开发配置 > 权限管理」
3. 批量导入权限（需要 `im:message.send_as_user` 等）
4. 申请激活
5. 创建应用版本并发布

### 常用权限列表

- `im:message` — 发送消息
- `im:message.send_as_user` — 以用户身份发送
- `im:message.group_msg` — 群消息
- `im:chat` — 聊天管理
- `im:chat:readonly` — 只读聊天
- `contact:user.base` — 读取用户基本信息

## 网络问题

### 问题：无法连接

**诊断**：
```bash
npx @larksuite/openclaw-lark doctor
```

**解决**：
1. 检查网络连通性
2. 确认飞书 API 可访问
3. 检查代理设置

## OpenClaw 3.2 工具调用问题

如 OpenClaw 3.2 无法调用工具，在配置中添加：

```json
{
  "tools": {
    "profile": "full",
    "sessions": {
      "visibility": "all"
    }
  }
}
```

## 获取诊断信息

如问题仍未解决，收集以下信息：

```bash
npx @larksuite/openclaw-lark info --all
```

并提交给技术支持。
