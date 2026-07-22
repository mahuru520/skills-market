---
name: happyhorse-text-to-video
description: 通过 Open.OspreyAI 网关使用 HappyHorse 1.0 文生视频 API。覆盖任务提交、异步轮询、视频下载完整流程，支持 720P/1080P、多种比例、1-10 秒时长。
version: "1.0"
category: video-generation
triggers:
  - HappyHorse 文生视频
  - happyhorse t2v
  - 文字生成视频
  - 文生视频
  - happyhorse-1.0-t2v
  - text to video
  - 视频生成

---

# HappyHorse 1.0 文生视频 (Text-to-Video)

## Overview

通过 Open.OspreyAI 网关 `https://open.ospreyai.cn` 使用 HappyHorse 1.0 模型将文字提示词生成高质量视频。

**HappyHorse** 是新一代文生视频大模型，支持中英文提示词，生成 720P/1080P 高清视频，最长 10 秒。采用异步任务模式：提交任务 → 轮询状态 → 下载视频。

核心特性：
- **高清输出**：支持 720P、1080P 分辨率
- **多种比例**：16:9（横屏）、9:16（竖屏）、1:1（方形）
- **灵活时长**：1-10 秒可调
- **中英双语**：提示词支持中文和英文
- **异步任务**：提交后立即返回 task_id，后台生成完成后通过 OSS 临时链接下载

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)

# 1. 提交文生视频任务
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-t2v",
    "prompt": "一只猫咪在阳光下慵懒地打哈欠",
    "resolution": "1080P",
    "ratio": "16:9",
    "duration": 5
  }'

# 2. 轮询任务状态
curl -s "$GW/v1/video/generations/{task_id}" \
  -H "Authorization: Bearer $API_KEY"

# 3. 下载视频
curl -sL "{result_url}" -o "$OUT/output.mp4"
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次生成视频 | → Route A: Submit Task |
| 需要查看任务是否完成 | → Route B: Check Status |
| 需要获取或下载视频 | → Route C: Download |
| 需要调优参数（分辨率、比例、时长） | → Route D: Tune Parameters |
| 需要排查错误 | → Route E: Troubleshoot |

## Route A: Submit Task

### 服务信息

- **网关地址**: `https://open.ospreyai.cn`
- **提交接口**: `POST /v1/video/generations`
- **查询接口**: `GET /v1/video/generations/{task_id}`
- **鉴权方式**: `Authorization: Bearer $API_KEY`（网关 API key，通过环境变量 `API_KEY` 传入）
- **异步头**: `X-DashScope-Async: enable`

### 请求参数

| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| model | string | ✅ | 模型名称 | `"happyhorse-1.0-t2v"` |
| prompt | string | ✅ | 视频描述（中英文均可） | `"一个小女孩在田园奔跑"` |
| resolution | string | ❌ | 分辨率：`720P` / `1080P` | `"1080P"` |
| ratio | string | ❌ | 画面比例：`16:9` / `9:16` / `1:1` | `"16:9"` |
| duration | integer | ❌ | 视频时长（秒），1-10 | `5` |

### 任务状态流转

```
queued → IN_PROGRESS (50%) → SUCCESS (100%) / FAILED
```

> 1080P 5秒视频生成通常需要 1-3 分钟。

## Route C: Download

任务成功后，从响应中获取视频下载链接：
- **`data.result_url`**：顶层字段，直接的下载 URL
- **`data.data.output.video_url`**：嵌套字段，同上

```bash
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)
curl -sL "{result_url}" -o "$OUT/output.mp4"
```

> ⚠️ 视频 URL 带签名参数，有效期约 24 小时，过期后需重新查询任务获取新链接。
> 保存路径通过 `get-output-dir.sh` 获取，由 `user-initialization` 技能统一约定输出目录。

## Route D: Tune Parameters

| 参数 | 可选值 | 说明 |
|------|--------|------|
| resolution | `720P` / `1080P` | 720P 较快（~1-2分钟），1080P 较慢（~2-3分钟） |
| ratio | `16:9` / `9:16` / `1:1` | 横屏/竖屏/方形 |
| duration | 1-10 秒 | 默认 5 秒 |

### 提示词技巧

- **中文**：自然语言描述即可，支持成语和文学化表达
- **英文**：细节描述效果更好
- **建议**：描述场景 + 主体 + 动作 + 光影 + 氛围

### 可用模型

| 模型 | 类型 | 说明 |
|------|------|------|
| `happyhorse-1.0-t2v` | 文生视频 | 本 Skill 默认模型 |
| `happyhorse-1.0-i2v` | 图生视频 | 以图片为起始帧生成视频 |
| `happyhorse-1.0-r2v` | 参考视频生成 | 以参考视频风格生成新视频 |
| `happyhorse-1.0-video-edit` | 视频编辑 | 对已有视频进行编辑 |

## Route E: Troubleshoot

| 问题 | 排查方法 |
|------|---------|
| `Invalid URL` | 检查 URL 是否为 `/v1/video/generations`（不是 `/v1/services/aigc/...`） |
| `prompt is required` | `prompt` 必须在顶层，不能嵌套在 `input` 对象中 |
| 401 鉴权失败 | 检查 Bearer Token 是否有效 |
| 任务长时间 IN_PROGRESS | 1080P 视频生成可能需要 2-3 分钟，耐心等待 |
| 任务 FAILED | 检查 `fail_reason` 字段，可能是提示词违规或模型过载 |

### 请求格式对比（常见错误）

| 项目 | ❌ 错误 | ✅ 正确 |
|------|--------|--------|
| URL | `/v1/services/aigc/video-generation/video-synthesis` | `/v1/video/generations` |
| prompt | `{"input": {"prompt": "..."}}` | `{"prompt": "..."}` |
| 参数 | `{"parameters": {"resolution": "720P"}}` | `{"resolution": "720P"}` |

## Verification Checklist

- [ ] 请求 URL 为 `POST /v1/video/generations`
- [ ] 请求头包含 `X-DashScope-Async: enable`
- [ ] `prompt` 在顶层（不嵌套）
- [ ] 提交成功，返回 `task_id` 和 `status: queued`
- [ ] 轮询直到 `status: SUCCESS`
- [ ] 从 `result_url` 下载 MP4 文件到 `get-output-dir.sh` 返回的输出目录
