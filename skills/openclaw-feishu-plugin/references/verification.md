# 飞书插件验证指南

## CLI 验证命令

### 基本信息

```bash
npx @larksuite/openclaw-lark info
```

预期输出：
- 插件版本
- 配置状态
- 连接状态

### 完整信息

```bash
npx @larksuite/openclaw-lark info --all
```

### 诊断检查

```bash
npx @larksuite/openclaw-lark doctor
```

### 自动修复

```bash
npx @larksuite/openclaw-lark doctor --fix
```

## 飞书端验证

### 检查安装状态

在飞书发送：
```
/feishu start
```

预期返回：版本信息（如 `Feishu Plugin v2026.3.17`）

### 检查配置健康

在飞书发送：
```
/feishu doctor
```

### 批量授权用户

在飞书发送：
```
/feishu auth
```

## OpenClaw 状态

```bash
openclaw status
```

预期：feishu 渠道显示 `ON` 或 `OK`

## 功能验证

1. 在飞书发送消息
2. AI 应自动回复
3. 验证工具调用能力（如有配置）

## 验证检查清单

- [ ] `npx @larksuite/openclaw-lark info` 返回版本信息
- [ ] `npx @larksuite/openclaw-lark doctor` 无错误
- [ ] `openclaw status` 显示 feishu 已启用
- [ ] 飞书端 `/feishu start` 返回版本
- [ ] 飞书端可触发 AI 回复
