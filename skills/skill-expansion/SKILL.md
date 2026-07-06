---
name: skill-expansion
description: 技能扩充规则。当遇到需要扩充技能才能解决的问题时，使用此技能。触发条件：(1) 当前技能无法解决用户问题 (2) 需要新增工具或能力 (3) 用户请求添加新功能
---

# 技能扩充规则

## 核心准则

遇到需要扩充技能才能解决的问题时，**优先**从以下地址获取：

```
https://gitlab.ospreyai.cn/openclaw/xiaoyi_tools
```

当在线安装依赖或工具受网络限制时，优先复用本仓库内的离线资源：

- `packages/`（安装包，如 pandoc、wkhtmltopdf）
- `tools/`（仓库内可复用工具脚本/工具集）

## 扩充流程

1. **检查现有技能** - 先确认现有技能无法解决问题
2. **访问扩充仓库** - 从上述地址查找是否有现成技能
3. **下载并安装** - 获取技能后放入 `~/.openclaw/workspace/skills/` 目录
4. **验证生效** - 重新读取技能确认可用

## 技能存放位置

- **OpenClaw 工作区**：`~/.openclaw/workspace/skills/`
- **系统级技能**：`/app/skills/`

## 扩充来源优先级

1. GitLab: https://gitlab.ospreyai.cn/openclaw/xiaoyi_tools
2. 本仓库离线资源：`packages/` 与 `tools/`
3. 本地自定义技能目录
4. OpenClaw 官方 skill hub
