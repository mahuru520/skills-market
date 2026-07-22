---
name: happyhorse-reference-to-video
description: 通过 Open.OspreyAI 网关使用 HappyHorse 1.0 参考视频生成 API。以 1-6 张参考图片为素材，配合文字描述，生成融合多图片元素的高清视频，720P/1080P，3-15 秒。
version: "1.0"
category: video-generation
triggers:
  - HappyHorse 参考视频
  - happyhorse r2v
  - 参考图片生成视频
  - 参考视频
  - happyhorse-1.0-r2v
  - reference to video
  - 多图视频
---

# HappyHorse 1.0 参考图片视频生成 (Reference-to-Video)

## Overview

通过 Open.OspreyAI 网关 `https://open.ospreyai.cn` 使用 HappyHorse 1.0 模型，以 1-6 张参考图片为素材，配合文字描述，生成融合多图片元素的高清视频。

**HappyHorse R2V** 是参考图片视频生成模型，可输入多张参考图片（最多 6 张），在 prompt 中通过 `[Image 1]`、`[Image 2]` 等引用对应图片元素，生成将多张图片内容融合在一起的连贯视频。采用异步任务模式：提交任务 → 轮询状态 → 下载视频。

核心特性：
- **多图融合**：支持 1-6 张参考图片，将不同图片元素融合到同一视频
- **Prompt 引用**：通过 `[Image N]` 语法精确引用对应图片内容
- **高清输出**：支持 720P、1080P 分辨率
- **多种比例**：16:9（横屏）、9:16（竖屏）、1:1（方形）
- **灵活时长**：3-15 秒可调
- **异步任务**：提交后立即返回 task_id，后台生成完成后通过 OSS 临时链接下载

与其他视频生成 Skill 的对比：

| Skill | 模型 | 输入 | 输出 | 适用场景 |
|-------|------|------|------|---------|
| [ComfyUI 视频生成](../comfyui-video-generation) | Wan 2.2 I2V | 1 张起始图 | ~5s 视频 | 图生视频（开源） |
| [ComfyUI 关键帧视频](../comfyui-keyframes-video-generation) | Wan 2.2 FLF2V | 6 张关键帧 | ~5s 视频 | 多关键帧过渡 |
| [ComfyUI Fun Inpaint](../comfyui-fun-inpaint-video-generation) | Wan 2.2 Fun Inpaint | 首帧 + 尾帧 | ~5s 视频 | 首尾帧过渡 |
| [HappyHorse 文生视频](../happyhorse-text-to-video) | HappyHorse 1.0 T2V | 文字提示词 | 1-10s 视频 | 纯文字驱动 |
| [HappyHorse 图生视频](../happyhorse-image-to-video) | HappyHorse 1.0 I2V | 1 张首帧 + 文字 | 3-15s 视频 | 图片动态化 |
| **本 Skill** | HappyHorse 1.0 R2V | 1-6 张参考图 + 文字 | 3-15s 视频 | 多图融合、风格迁移 |

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)

# 1. 提交参考图片视频任务
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-r2v",
    "prompt": "[Image 1]中的女性微笑着向镜头挥手，背景是[Image 2]中的城市风景",
    "images": [
      "https://example.com/girl.jpg",
      "https://example.com/city.jpg"
    ],
    "resolution": "720P",
    "ratio": "16:9",
    "duration": 5,
    "watermark": false
  }'

# 2. 轮询任务状态
curl -s "$GW/v1/video/generations/{task_id}" \
  -H "Authorization: Bearer $API_KEY"

# 3. 下载视频（从响应中的 result_url 字段获取）
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

- 网关地址: `https://open.ospreyai.cn`
- 提交接口: `POST /v1/video/generations`
- 查询接口: `GET /v1/video/generations/{task_id}`
- 鉴权方式: `Authorization: Bearer $API_KEY`
- 异步头: `X-DashScope-Async: enable`

### Step 1: 提交参考图片视频任务

```bash
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-r2v",
    "prompt": "[Image 1]中身着红色旗袍的女性，轻抬玉手展开[Image 2]中的折扇，[Image 3]中的流苏耳坠随头部转动轻盈摆动",
    "images": [
      "https://example.com/girl.jpg",
      "https://example.com/fan.jpg",
      "https://example.com/earrings.jpg"
    ],
    "resolution": "720P",
    "ratio": "16:9",
    "duration": 5,
    "watermark": false
  }'
```

**响应：**

```json
{
    "id": "task_xxxxxxxxxxxxxxxxxxxxxxxxx",
    "task_id": "task_xxxxxxxxxxxxxxxxxxxxxxxxx",
    "object": "video",
    "model": "happyhorse-1.0-r2v",
    "status": "queued",
    "progress": 0,
    "created_at": 1780000000
}
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| model | string | ✅ | 模型名称 | `"happyhorse-1.0-r2v"` |
| prompt | string | ✅ | 视频描述，用 `[Image N]` 引用图片 | `"[Image 1]中的女性..."` |
| images | array | ✅ | 图片 URL 数组，1-6 张 | `["url1", "url2"]` |
| resolution | string | ❌ | 分辨率：`720P` / `1080P` | `"720P"` |
| ratio | string | ❌ | 画面比例：`16:9` / `9:16` / `1:1` | `"16:9"` |
| duration | integer | ❌ | 视频时长（秒），3-15，默认 5 | `5` |
| watermark | boolean | ❌ | 是否添加水印，默认 `true` | `false` |
| seed | integer | ❌ | 随机种子 `[0, 2147483647]` | `42` |

### images 字段说明

`images` 是一个字符串数组，包含 1-6 个图片 URL。**图片顺序对应 prompt 中的引用**：第 1 张图片对应 `[Image 1]`，第 2 张对应 `[Image 2]`，以此类推。

支持两种格式：
1. **公网 URL**：`["https://example.com/photo.png"]`
2. **Base64 编码**：`["data:image/png;base64,iVBORw0KGgo..."]`

### 图片要求

| 限制项 | 要求 |
|--------|------|
| 格式 | JPEG、JPG、PNG、WEBP |
| 分辨率 | 宽和高均不小于 300 像素 |
| 宽高比 | 1:2.5 ~ 2.5:1 |
| 文件大小 | 不超过 20MB |
| 数量 | 1-6 张 |

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

> 720P 5秒视频生成通常需要 1-3 分钟。

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
| resolution | `720P` / `1080P` | 720P 较快，1080P 较慢 |
| ratio | `16:9` / `9:16` / `1:1` | 横屏/竖屏/方形（R2V 支持 ratio） |
| duration | 3-15 秒 | 默认 5 秒 |
| watermark | `true` / `false` | 默认 `true`，示例中用 `false` |
| seed | 0-2147483647 | 固定可提高复现性 |

### Prompt 引用语法

R2V 的核心能力是在 prompt 中通过 `[Image N]` 引用参考图片：
- `[Image 1]` — 引用 `images` 数组中第 1 张图片
- 以此类推，最多 `[Image 6]`

**编写技巧：**
- 每个 `[Image N]` 后描述该图片元素的动作或状态变化
- 描述镜头运动（推、拉、摇、移）来控制视频节奏
- 可以只引用部分图片，未引用的图片作为风格参考

### 输出视频参数

- **分辨率**: 720P 或 1080P（按请求参数）
- **比例**: 16:9 / 9:16 / 1:1
- **时长**: 3-15 秒
- **格式**: MP4

## Route E: Troubleshoot

| 问题 | 排查方法 |
|------|---------|
| `Invalid URL` | 检查 URL 是否为 `/v1/video/generations`（不是 `/v1/services/aigc/...`） |
| `prompt is required` | `prompt` 是必填字段，必须在顶层 |
| `r2v requires at least 1 reference_image media item` | 必须用 `images`（字符串数组），不是 `media` |
| `happyhorse supports video task relay only` | 必须走 `/v1/video/generations` |
| 401 鉴权失败 | 检查 Bearer Token 是否有效 |
| 任务长时间 IN_PROGRESS | R2V 生成可能需要 2-5 分钟，耐心等待 |
| 任务 FAILED | 检查 `fail_reason` 字段，可能是图片不合规或模型过载 |
| 视频 URL 过期 | 重新查询任务状态获取新的 `result_url` |
| `[Image N]` 引用无效 | 确保 N 在 1 到 images 数组长度范围内 |

### 请求格式对比（常见错误）

| 项目 | ❌ 错误（DashScope 原始格式） | ✅ 正确（网关适配格式） |
|------|------|------|
| URL | `/v1/services/aigc/video-generation/video-synthesis` | `/v1/video/generations` |
| prompt | `{"input": {"prompt": "..."}}` | `{"prompt": "..."}` |
| 图片 | `{"input": {"media": [{"type": "reference_image", "url": "..."}]}}` | `{"images": ["..."]}` |
| 参数 | `{"parameters": {"resolution": "720P"}}` | `{"resolution": "720P"}` |

> ⚠️ **关键差异**：网关将 DashScope 的 `input.media` 数组格式简化为 `images` 字符串数组。不再需要 `type: "reference_image"` 包装，直接传图片 URL 即可。

## Verification Checklist

- [ ] 请求 URL 为 `POST /v1/video/generations`（不是 DashScope 原始路径）
- [ ] 请求头包含 `X-DashScope-Async: enable`
- [ ] `prompt` 在顶层（必填，使用 `[Image N]` 引用图片）
- [ ] `images` 在顶层，为包含 1-6 个 URL 字符串的数组（不是 `media` 对象数组）
- [ ] 图片 URL 可公网访问，格式符合要求
- [ ] `[Image N]` 中的 N 对应 images 数组中的位置（从 1 开始）
- [ ] 提交成功，返回 `task_id` 和 `status: "queued"`
- [ ] 轮询直到 `status: "SUCCESS"`
- [ ] 从 `result_url` 下载 MP4 文件到 `get-output-dir.sh` 返回的输出目录
- [ ] 视频分辨率、比例、时长与请求参数一致
