---
name: happyhorse-image-to-video
description: 通过 Open.OspreyAI 网关使用 HappyHorse 1.0 图生视频 API。以首帧图片为基础，配合文字引导，生成 720P/1080P 高清视频，3-15 秒可调。
version: "1.0"
category: video-generation
triggers:
  - HappyHorse 图生视频
  - happyhorse i2v
  - 图片生成视频
  - 图生视频
  - happyhorse-1.0-i2v
  - image to video
  - 首帧视频
---

# HappyHorse 1.0 图生视频 (Image-to-Video)

## Overview

通过 Open.OspreyAI 网关 `https://open.ospreyai.cn` 使用 HappyHorse 1.0 模型，以首帧图片为基础，配合文字描述引导，生成物理真实、运动流畅的高清视频。

**HappyHorse I2V** 是图生视频模型，输入一张首帧图片和文字提示词，引导运动方向和内容，输出 720P/1080P 高清视频，最长 15 秒。采用异步任务模式：提交任务 → 轮询状态 → 下载视频。

核心特性：
- **首帧驱动**：以输入图片为视频第一帧，生成连贯运动
- **文字引导**：prompt 描述期望的运动和内容（必填）
- **高清输出**：支持 720P、1080P 分辨率
- **保持比例**：输出视频宽高比与输入图片一致
- **灵活时长**：3-15 秒可调（比 T2V 的 1-10 秒更长）
- **异步任务**：提交后立即返回 task_id，后台生成完成后通过 OSS 临时链接下载

与其他视频生成 Skill 的对比：

| Skill | 模型 | 输入 | 输出 | 适用场景 |
|-------|------|------|------|---------|
| [ComfyUI 视频生成](../comfyui-video-generation) | Wan 2.2 I2V | 1 张起始图 | ~5s 视频 | 图生视频（开源） |
| [ComfyUI 关键帧视频](../comfyui-keyframes-video-generation) | Wan 2.2 FLF2V | 6 张关键帧 | ~5s 视频 | 多关键帧过渡 |
| [ComfyUI Fun Inpaint](../comfyui-fun-inpaint-video-generation) | Wan 2.2 Fun Inpaint | 首帧 + 尾帧 | ~5s 视频 | 首尾帧过渡 |
| [HappyHorse 文生视频](../happyhorse-text-to-video) | HappyHorse 1.0 T2V | 文字提示词 | 1-10s 视频 | 纯文字驱动 |
| **本 Skill** | HappyHorse 1.0 I2V | 首帧图片 + 文字 | 3-15s 视频 | 图片动态化、产品展示 |

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)

# 1. 提交图生视频任务
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-i2v",
    "prompt": "一只猫在草地上奔跑",
    "images": ["https://your-image-url.com/photo.png"],
    "resolution": "1080P",
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
| 需要调优参数（分辨率、时长） | → Route D: Tune Parameters |
| 需要排查错误 | → Route E: Troubleshoot |

## Route A: Submit Task

### 服务信息

- 网关地址: `https://open.ospreyai.cn`
- 提交接口: `POST /v1/video/generations`
- 查询接口: `GET /v1/video/generations/{task_id}`
- 鉴权方式: `Authorization: Bearer $API_KEY`
- 异步头: `X-DashScope-Async: enable`

### Step 1: 提交图生视频任务

```bash
curl -s -X POST "$GW/v1/video/generations" \
  -H "X-DashScope-Async: enable" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "happyhorse-1.0-i2v",
    "prompt": "A girl smiling and turning to look at the camera",
    "images": ["https://your-image-url.com/photo.png"],
    "resolution": "720P",
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
    "model": "happyhorse-1.0-i2v",
    "status": "queued",
    "progress": 0,
    "created_at": 1780000000
}
```

> 记住 `task_id`，用于后续查询任务状态和获取视频。

### 请求参数

| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| model | string | ✅ | 模型名称 | `"happyhorse-1.0-i2v"` |
| prompt | string | ✅ | 视频描述（引导运动方向和内容，中英文均可） | `"一只猫在草地上奔跑"` |
| images | array | ✅ | 图片 URL 数组，有且仅有 1 个元素 | `["https://..."]` |
| resolution | string | ❌ | 分辨率：`720P` / `1080P`（默认） | `"1080P"` |
| duration | integer | ❌ | 视频时长（秒），3-15，默认 5 | `5` |
| watermark | boolean | ❌ | 是否添加水印，默认 `true` | `false` |
| seed | integer | ❌ | 随机种子 `[0, 2147483647]`，固定可提高复现性 | `42` |

### images 字段说明

`images` 是一个字符串数组，包含 1 个图片 URL：

```json
"images": ["https://example.com/photo.png"]
```

支持两种格式：

1. **公网 URL**：HTTP 或 HTTPS 协议
   ```json
   "images": ["https://example.com/photo.png"]
   ```
2. **Base64 编码**：
   ```json
   "images": ["data:image/png;base64,iVBORw0KGgo..."]
   ```

### 图片要求

| 限制项 | 要求 |
|--------|------|
| 格式 | JPEG、JPG、PNG、WEBP |
| 分辨率 | 宽和高均不小于 300 像素 |
| 宽高比 | 1:2.5 ~ 2.5:1 |
| 文件大小 | 不超过 20MB |
| 数量 | 有且仅有 1 张 |

## Route B: Check Status

### 查询任务状态

```bash
curl -s "$GW/v1/video/generations/{task_id}" \
  -H "Authorization: Bearer $API_KEY"
```

**已完成：**

```json
{
    "code": "success",
    "data": {
        "task_id": "task_xxx",
        "status": "SUCCESS",
        "progress": "100%",
        "result_url": "https://dashscope-a717.oss-accelerate.aliyuncs.com/...",
        "data": {
            "output": {
                "task_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "video_url": "https://dashscope-a717.oss-accelerate.aliyuncs.com/...",
                "task_status": "SUCCEEDED"
            }
        }
    }
}
```

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
| resolution | `720P` / `1080P` | 1080P 默认（较慢），720P 较快 |
| duration | 3-15 秒 | 默认 5 秒（比 T2V 的 1-10s 更长） |
| watermark | `true` / `false` | 默认 `true`，示例中用 `false` |
| seed | 0-2147483647 | 固定可提高复现性 |

### 提示词技巧

I2V 的 prompt 用于**引导运动方向和内容**：
- **简短 prompt**：`"镜头缓慢推进"` / `"slow camera zoom in"`
- **详细 prompt**：`"一只猫突然站起来，向镜头跑来，阳光明媚"`
- **建议**：描述动作 + 运动方向 + 光影氛围

### 输出视频参数

- **分辨率**: 720P 或 1080P（按请求参数）
- **比例**: 与输入首帧图片一致（无 `ratio` 参数）
- **时长**: 3-15 秒
- **格式**: MP4

## Route E: Troubleshoot

| 问题 | 排查方法 |
|------|---------|
| `Invalid URL` | 检查 URL 是否为 `/v1/video/generations`（不是 `/v1/services/aigc/...`） |
| `prompt is required` | `prompt` 是必填字段，必须在顶层 |
| `i2v requires exactly 1 first_frame media item` | 必须用 `images`（字符串数组，1 个元素），不是 `media` |
| `happyhorse supports video task relay only` | 必须走 `/v1/video/generations`，不能走 `/v1/chat/completions` |
| 401 鉴权失败 | 检查 Bearer Token 是否有效 |
| 任务长时间 IN_PROGRESS | 1080P 视频生成可能需要 2-3 分钟，耐心等待 |
| 任务 FAILED | 检查 `fail_reason` 字段，可能是图片不合规或模型过载 |
| 视频 URL 过期 | 重新查询任务状态获取新的 `result_url` |
| duration 不生效 | I2V 取值范围是 [3, 15]，不是 T2V 的 [1, 10] |

### 请求格式对比（常见错误）

| 项目 | ❌ 错误（DashScope 原始格式） | ✅ 正确（网关适配格式） |
|------|------|------|
| URL | `/v1/services/aigc/video-generation/video-synthesis` | `/v1/video/generations` |
| prompt | `{"input": {"prompt": "..."}}` | `{"prompt": "..."}` |
| 图片 | `{"input": {"media": [{"type": "first_frame", "url": "..."}]}}` | `{"images": ["..."]}` |
| 参数 | `{"parameters": {"resolution": "720P"}}` | `{"resolution": "720P"}` |

> ⚠️ **关键差异**：网关将 DashScope 的 `input.media` 数组格式简化为 `images` 字符串数组。不再需要 `type: "first_frame"` 包装，直接传图片 URL 即可。

## Verification Checklist

- [ ] 请求 URL 为 `POST /v1/video/generations`（不是 DashScope 原始路径）
- [ ] 请求头包含 `X-DashScope-Async: enable`
- [ ] `prompt` 在顶层（必填，不嵌套在 `input` 中）
- [ ] `images` 在顶层，为包含 1 个 URL 字符串的数组（不是 `media` 对象数组）
- [ ] 图片 URL 可公网访问，格式符合要求
- [ ] 提交成功，返回 `task_id` 和 `status: "queued"`
- [ ] 轮询直到 `status: "SUCCESS"`
- [ ] 从 `result_url` 下载 MP4 文件到 `get-output-dir.sh` 返回的输出目录
- [ ] 视频分辨率、时长与请求参数一致
