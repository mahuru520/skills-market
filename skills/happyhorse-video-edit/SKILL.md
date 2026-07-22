---
name: happyhorse-video-edit
description: "（暂不可用）通过 Open.OspreyAI 网关使用 HappyHorse 1.0 视频编辑 API。输入视频 + 可选参考图 + 文字指令，完成风格变换、局部替换等编辑任务，720P/1080P，3-15 秒。"
version: "1.0"
category: video-generation
triggers:
  - HappyHorse 视频编辑
  - happyhorse video edit
  - 视频编辑
  - happyhorse-1.0-video-edit
  - video edit
  - 视频风格变换
  - 视频局部替换
---

# HappyHorse 1.0 视频编辑 (Video Edit) — 暂不可用

::: warning 暂不可用
网关翻译层尚未适配 Video Edit 模型的视频输入字段映射（T2V/I2V/R2V 已适配）。当前调用会返回 `"video-edit requires exactly 1 video media item"` 错误。需等待网关侧更新后方可使用。以下文档基于 DashScope 官方 API 推导，待适配完成后 `video_url` 字段格式可能会调整。
:::

## Overview

通过 Open.OspreyAI 网关 `https://open.ospreyai.cn` 使用 HappyHorse 1.0 模型，对已有视频进行编辑：风格变换、局部替换等。支持输入视频 + 可选参考图 + 文字指令。

**HappyHorse Video Edit** 是视频编辑模型，输入一段待编辑视频，可选 0-5 张参考图片，配合文字指令完成各种编辑任务。输出视频时长 3-15 秒（输入视频 ≤15 秒时，输出与输入时长一致）。采用异步任务模式：提交任务 → 轮询状态 → 下载视频。

核心特性：
- **视频编辑**：对已有视频进行风格变换、局部替换等编辑
- **参考图引导**：可选 0-5 张参考图片，引导编辑效果
- **文字指令**：prompt 描述编辑意图（风格转换、替换物体等）
- **高清输出**：支持 720P、1080P 分辨率
- **保持时长**：输入视频 ≤15 秒时，输出时长与输入一致
- **异步任务**：提交后立即返回 task_id，后台编辑完成后通过 OSS 临时链接下载

与其他 HappyHorse Skill 的对比：

| Skill | 模型 | 输入 | 输出 | 适用场景 |
|-------|------|------|------|---------|
| [HappyHorse 文生视频](../happyhorse-text-to-video) | T2V | 文字提示词 | 1-10s 视频 | 纯文字驱动 |
| [HappyHorse 图生视频](../happyhorse-image-to-video) | I2V | 1 张首帧 + 文字 | 3-15s 视频 | 图片动态化 |
| [HappyHorse 参考视频](../happyhorse-reference-to-video) | R2V | 1-6 张参考图 + 文字 | 3-15s 视频 | 多图融合 |
| **本 Skill** | Video Edit | 视频 + 可选参考图 + 文字 | 3-15s 视频 | 视频编辑、风格变换 |

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)

# 1. 提交视频编辑任务
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-video-edit",
    "prompt": "让视频中的角色穿上图片中的条纹毛衣",
    "video_url": "https://example.com/video.mp4",
    "images": ["https://example.com/clothes.png"],
    "resolution": "720P",
    "watermark": false
  }'

# 2. 轮询任务状态（视频编辑通常需要数分钟）
curl -s "$GW/v1/video/generations/{task_id}" \
  -H "Authorization: Bearer $API_KEY"

# 3. 下载编辑后的视频
curl -sL "{result_url}" -o "$OUT/edited_video.mp4"
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次编辑视频 | → Route A: Submit Task |
| 需要查看任务是否完成 | → Route B: Check Status |
| 需要获取或下载视频 | → Route C: Download |
| 需要调优参数 | → Route D: Tune Parameters |
| 需要排查错误 | → Route E: Troubleshoot |

## Route A: Submit Task

### 服务信息

- 网关地址: `https://open.ospreyai.cn`
- 提交接口: `POST /v1/video/generations`
- 查询接口: `GET /v1/video/generations/{task_id}`
- 鉴权方式: `Authorization: Bearer $API_KEY`
- 异步头: `X-DashScope-Async: enable`

### Step 1: 提交视频编辑任务

```bash
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-video-edit",
    "prompt": "将视频转换为水彩画风格",
    "video_url": "https://example.com/video.mp4",
    "resolution": "720P",
    "watermark": false
  }'
```

**响应：**

```json
{
    "id": "task_xxxxxxxxxxxxxxxxxxxxxxxxx",
    "task_id": "task_xxxxxxxxxxxxxxxxxxxxxxxxx",
    "object": "video",
    "model": "happyhorse-1.0-video-edit",
    "status": "queued",
    "progress": 0,
    "created_at": 1780000000
}
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| model | string | ✅ | 模型名称 | `"happyhorse-1.0-video-edit"` |
| prompt | string | ✅ | 编辑指令（描述编辑意图） | `"将视频转换为水彩画风格"` |
| video_url | string | ✅ | 待编辑视频 URL | `"https://example.com/video.mp4"` |
| images | array | ❌ | 参考图片 URL 数组，0-5 张 | `["https://..."]` |
| resolution | string | ❌ | 分辨率：`720P` / `1080P` | `"720P"` |
| watermark | boolean | ❌ | 是否添加水印，默认 `true` | `false` |
| seed | integer | ❌ | 随机种子 `[0, 2147483647]` | `42` |

### video_url 字段说明

`video_url` 是待编辑视频的 URL，支持两种格式：
1. **公网 URL**：`"https://example.com/video.mp4"`
2. **Base64 编码**（不推荐，视频文件较大）：`"data:video/mp4;base64,AAAA..."`

### 视频要求

| 限制项 | 要求 |
|--------|------|
| 时长 | 3-60 秒 |
| 分辨率 | 长边不超过 1920 像素 |
| 文件大小 | 不超过 100MB |
| 格式 | MP4（推荐）、MOV |

> ⚠️ 输出视频时长为 3-15 秒。当输入视频 ≤15 秒时，输出时长与输入一致；超过 15 秒时，输出固定为 15 秒。

### images 字段说明（可选）

`images` 是参考图片 URL 数组（0-5 张），在 prompt 中通过 `[Image N]` 引用对应图片：
```
让视频中的角色穿上[Image 1]中的衣服，背景换成[Image 2]的风格
```

| 限制项 | 要求 |
|--------|------|
| 格式 | JPEG、JPG、PNG、WEBP |
| 分辨率 | 宽和高均不小于 300 像素 |
| 宽高比 | 1:2.5 ~ 2.5:1 |
| 文件大小 | 不超过 20MB |
| 数量 | 0-5 张（可选） |

## Route B: Check Status

### 查询任务状态

```bash
curl -s "$GW/v1/video/generations/{task_id}" \
  -H "Authorization: Bearer $API_KEY"
```

### 任务状态流转

```
queued → IN_PROGRESS (50%) → SUCCESS (100%) / FAILED
```

> ⚠️ 视频编辑任务耗时较长（通常 2-10 分钟），比 T2V/I2V/R2V 更久，请耐心等待。

## Route C: Download

任务成功后，从响应中获取视频下载链接：
- **`data.result_url`**：顶层字段，直接的下载 URL
- **`data.data.output.video_url`**：嵌套字段，同上

```bash
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)
curl -sL "{result_url}" -o "$OUT/edited_video.mp4"
```

> ⚠️ 视频 URL 带签名参数，有效期约 24 小时，过期后需重新查询任务获取新链接。
> 保存路径通过 `get-output-dir.sh` 获取，由 `user-initialization` 技能统一约定输出目录。

## Route D: Tune Parameters

| 参数 | 可选值 | 说明 |
|------|--------|------|
| resolution | `720P` / `1080P` | 720P 较快，1080P 较慢 |
| watermark | `true` / `false` | 默认 `true`，示例中用 `false` |
| seed | 0-2147483647 | 固定可提高复现性 |

> ⚠️ Video Edit 不支持 `duration` 和 `ratio` 参数。输出视频时长由输入视频决定（≤15 秒时保持一致），画面比例与输入视频一致。

### Prompt 编写技巧

Video Edit 的 prompt 用于**描述编辑意图**：
- **风格转换**：`"将视频转换为水彩画风格"` / `"将视频转换为赛博朋克风格"`
- **局部替换（配合参考图）**：`"让视频中的角色穿上[Image 1]中的条纹毛衣"`
- **添加/移除元素**：`"在视频背景中添加樱花飘落的效果"`
- **运动调整**：`"将视频转换为慢动作效果"`

## Route E: Troubleshoot

| 问题 | 排查方法 |
|------|---------|
| `video-edit requires exactly 1 video media item` | **网关尚未适配**,需等待网关侧更新 `video_url` 字段映射 |
| `Invalid URL` | 检查 URL 是否为 `/v1/video/generations`（不是 `/v1/services/aigc/...`） |
| `prompt is required` | `prompt` 是必填字段，必须在顶层 |
| `video_url is required` | `video_url` 是必填字段，必须提供待编辑视频的 URL |
| `happyhorse supports video task relay only` | 必须走 `/v1/video/generations` |
| 401 鉴权失败 | 检查 Bearer Token 是否有效 |
| 任务长时间 IN_PROGRESS | 视频编辑通常需要 2-10 分钟，耐心等待 |
| 任务 FAILED | 检查 `fail_reason` 字段，可能是视频不合规或模型过载 |
| 视频不符合要求 | 检查时长（3-60s）、分辨率（长边≤1920px）、大小（≤100MB） |

### 请求格式对比（常见错误）

| 项目 | ❌ 错误（DashScope 原始格式） | ✅ 正确（网关适配格式） |
|------|------|------|
| URL | `/v1/services/aigc/video-generation/video-synthesis` | `/v1/video/generations` |
| prompt | `{"input": {"prompt": "..."}}` | `{"prompt": "..."}` |
| 视频 | `{"input": {"media": [{"type": "video", "url": "..."}]}}` | `{"video_url": "..."}` |
| 参考图 | `{"input": {"media": [..., {"type": "reference_image", "url": "..."}]}}` | `{"images": ["..."]}` |
| 参数 | `{"parameters": {"resolution": "720P"}}` | `{"resolution": "720P"}` |

> ⚠️ **关键差异**：网关将 DashScope 的 `input.media` 拆分为 `video_url`（视频）和 `images`（参考图片 URL 数组）。

## Verification Checklist

- [ ] 确认网关已适配 Video Edit（当前返回 `video-edit requires exactly 1 video media item` 即未适配）
- [ ] 请求 URL 为 `POST /v1/video/generations`
- [ ] 请求头包含 `X-DashScope-Async: enable`
- [ ] `prompt` 在顶层（必填，描述编辑意图）
- [ ] `video_url` 在顶层（必填，待编辑视频 URL）
- [ ] `images` 在顶层（可选，参考图片 URL 数组，0-5 张）
- [ ] 视频 URL 可公网访问，格式符合要求（时长 3-60s，≤100MB）
- [ ] 提交成功，返回 `task_id` 和 `status: "queued"`
- [ ] 轮询直到 `status: "SUCCESS"`（间隔建议 10 秒）
- [ ] 从 `result_url` 下载 MP4 文件到 `get-output-dir.sh` 返回的输出目录
