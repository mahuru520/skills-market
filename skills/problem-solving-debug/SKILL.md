---
name: problem-solving-debug
description: 问题排查与解决技能。当遇到之前可以做到但后来有问题的事情时，使用此技能进行系统性排查。触发条件：(1) 之前成功现在失败 (2) 遇到反复失败的问题 (3) 需要找到根本原因

# 问题排查与解决技能

## 核心原则

**遇到之前可以做到但后来有问题的事情时：**

1. ✅ **先查找相关文档/技能**
   - 查看是否有已保存的技能手册
   - 搜索相关文档（如 SKILL.md、用户手册等）
   - 访问扩展仓库查找已有解决方案

2. ✅ **查看服务器/环境信息**
   - 检查可用的模型、节点
   - 确认服务状态和配置
   - 对比之前成功时的环境差异

3. ✅ **使用经过验证的方法**
   - 优先使用已有成功案例
   - 避免重复尝试已知失败的方法
   - 记录每次尝试的结果

4. ❌ **不要重复失败**
   - 多次失败后应停止并反思
   - 改变思路而非重复同样操作

## 排查流程

```
问题出现
    ↓
1. 查找文档/技能 ← 优先！
2. 查看环境信息
3. 尝试已知方法
4. 分析失败原因
5. 记录经验教训
```

## 实践案例

### 案例：ComfyUI 视频生成失败

**问题：** 用户要求生成视频，但 API 节点一直报错 "Unauthorized"

**错误做法（❌）：**
- 反复尝试不同的 API 节点（WanImageToVideoApi、LtxvApiImageToVideo、MoonvalleyImg2VideoNode）
- 没有先查找文档

**正确做法（✅）：**
1. 查找技能文档 → 找到 `comfyui-video-generation` 技能
2. 查看详细手册 → 发现完整的本地工作流
3. 检查服务器模型 → 确认所需的模型都存在
4. 使用本地工作流 → 最终成功

**经验教训：**
- 所有外部 API 节点需要登录认证
- 本地工作流不依赖外部认证
- 文档中已有完整的可执行工作流

## 常用排查命令

### 查看 ComfyUI 可用节点
```bash
curl -s "http://<server>/object_info" | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join([k for k in d.keys()]))"
```

### 查看可用模型
```bash
curl -s "http://<server>/object_info/<节点类型>" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['<节点类型>']['input']['required'])"
```

### 查看历史任务
```bash
curl -s "http://<server>/history" | python3 -m json.tool
```

## 输出模板

每次问题解决后，记录：

```markdown
## 问题记录

**问题描述：**
<描述>

**排查步骤：**
1. <步骤1>
2. <步骤2>
3. <步骤3>

**最终解决方案：**
<方案>

**经验教训：**
- <教训1>
- <教训2>
```

## 技能来源

- GitLab: https://gitlab.ospreyai.cn/openclaw/xiaoyi_tools
- 本地技能目录: ~/.openclaw/workspace/skills/
- 系统技能目录: /app/skills/
