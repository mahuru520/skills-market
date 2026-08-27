---
name: minimax-h3-first-last-frame-video
description: "通过 Osprey 官方 MiniMax H3 V2 接口，以首帧、尾帧或首尾帧图片生成视频并下载 mp4。当用户要求图生视频、图片生成视频、首帧生成视频、尾帧生成视频、首尾帧生成视频、让图片动起来时使用。"
metadata: { "openclaw": { "emoji": "🖼️" } }
---

# MiniMax H3 首帧 / 尾帧 / 首尾帧图生视频

通过 Osprey 官方 MiniMax H3 V2 接口 `https://open.ospreyai.cn` 创建图生视频任务。

通过 `content` 多模态数组传入图片：首帧用 `role=first_frame`，尾帧用 `role=last_frame`，配合提示词生成带同步音频的动态视频。支持三种模式：仅首帧、仅尾帧、首尾帧。MiniMax H3 原生支持**音视频联合生成**，输出 mp4 自带音频轨。任务异步执行：提交任务 → 轮询状态 → 下载结果。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 仅首帧，默认 768P / adaptive / 5 秒
python scripts/image_to_video.py \
  --image first.png \
  --prompt "A slow camera push-in, the subject begins to move naturally" \
  --duration 5 --output ./output.mp4

# 首尾帧（两张图之间的自然过渡）
python scripts/image_to_video.py \
  --image first.png --last-image last.png \
  --prompt "A smooth cinematic transition from the first frame to the last frame" \
  --duration 8 --output ./output.mp4

# 仅尾帧（视频在指定画面结束，模型生成通向尾帧的过程）
python scripts/image_to_video.py \
  --last-image last.png \
  --prompt "The scene slowly resolves into this final frame, camera settling gently" \
  --duration 5 --output ./output.mp4
```

## 输入图片

`--image` 和 `--last-image` 支持：

- 本地文件路径：脚本自动转换为官方支持的 `data:` URI
- `https://` / `http://` 图片 URL：直接传给网关
- `mm_file://...` 或 `data:` URI：直接传给网关

如使用 `pic.ospreyai.cn` 把图片转成公网 URL，把返回的 URL 直接传给 `--image` 或 `--last-image` 即可。

## 工作原理

- **接口**：官方 MiniMax H3 V2 —— `POST /v2/video_generation`（提交）+ `GET /v2/query/video_generation/{task_id}`（查询）
- **请求体**：`model=MiniMax-H3`，`content` 数组含提示词文本 + 图片项
  - 首帧：`{"type":"image_url","image_url":{"url":...},"role":"first_frame"}`
  - 尾帧：`{"type":"image_url","image_url":{"url":...},"role":"last_frame"}`
- **音视频联合**：MiniMax H3 原生生成，输出 mp4 自带同步音频轨
- **异步任务**：提交返回 `task_id`，轮询直到 `task.status=succeeded`，从 `task.content.url` 取视频地址下载（OSS 预签名直链，无需 token，有时效）

> 视频生成较慢，通常 3–8 分钟（视排队与负载）。

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--image` | 首帧图片路径或公网 URL（与 `--last-image` 至少给一张） | — |
| `--last-image` | 尾帧图片路径或公网 URL（不填 `--image` 时为仅尾帧模式） | — |
| `--prompt` | 视频动作/镜头描述提示词（最多 7000 字符，必须） | — |
| `--resolution` | 分辨率：`768P` / `2K`（当前网关仅支持 768P，2K 暂不可用） | `768P` |
| `--ratio` | 画面比例（图生视频默认 `adaptive`，跟随输入图） | `adaptive` |
| `--duration` | 视频时长（4–15 秒整数） | `5` |
| `--output` | 本地 mp4 保存路径 | 当前目录 `minimax_h3_i2v.mp4` |
| `--timeout` | 轮询超时秒数 | `600` |
| `--gw` | 网关地址 | 环境变量 `GW` |
| `--api-key` | 网关 API key（`sk-xxx`） | 环境变量 `API_KEY` |

> `--aspect-ratio` 是 `--ratio` 的别名，兼容旧写法。

### Python 脚本

```bash
# 单首帧，5 秒
python scripts/image_to_video.py --image portrait.png --prompt "A slow push-in on the subject"

# 首尾帧，8 秒
python scripts/image_to_video.py --image first.png --last-image last.png \
  --prompt "A smooth transition from the first to the last frame" --duration 8

# 仅尾帧，5 秒（视频在指定画面结束）
python scripts/image_to_video.py --last-image ending.png \
  --prompt "The scene slowly resolves into this final frame, camera settling gently"

# 用图片 URL 作首帧
python scripts/image_to_video.py --image https://example.com/frame.png --prompt "..."
```

### 脚本内部流程

1. 把本地图片转 `data:` URI（URL 原样透传）
2. 组装 `content` 数组：文本提示词 + 首帧（如有）+ 尾帧（如有）；至少给一张图片
3. `POST /v2/video_generation` 提交任务，拿 `task_id`
4. 每 10 秒轮询 `GET /v2/query/video_generation/{task_id}`，读 `task.status`
5. `status=succeeded` 后从 `task.content.url` 下载 mp4 到 `--output`

## 提示词技巧

MiniMax H3 的文本编码器基于 Qwen3-VL，**支持长篇分镜脚本**，可包含：

- 整体风格 + 场景概述
- 逐镜头分镜（`[0s-1.5s] Shot 1: ...`）
- 运镜、光影、质感描述
- 音频提示（`Audio: wind, footsteps, low score...`）——模型会据此处生成同步音轨

首帧图片决定起始画面，尾帧图片决定结束画面，提示词驱动其间的运镜与变化。仅尾帧时，模型生成"通向尾帧"的过程。

## 下载结果

任务成功后，视频地址在 `task.content.url`（OSS 预签名直链，无需 token，有时效），脚本自动下载到 `--output`。也可手动 curl：

```bash
curl -L "$VIDEO_URL" -o result.mp4
```

**输出：** MP4 视频（**带音频**），默认 768P / 比例跟随输入图 / 约 5 秒。

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| `--image 和 --last-image 至少需要提供一张` | 两个都没传 | 至少给一张首帧或尾帧图 |
| 图片不存在 | 本地路径错 | 检查 `--image` / `--last-image` 路径，或改用 URL |
| 创建任务未返回 task_id | 网关异常 | 检查 `GW` 地址、网络，看返回体 |
| 任务 failed | 内容审核 / 参数非法 | 看 `task.error`，调整 prompt |
| 轮询超时 | 生成排队久 | 调大 `--timeout` |
| 下载 404 / 链接失效 | `task.content.url` 有时效 | 任务完成后及时下载；URL 失效可重新查询任务获取新链接 |

## 限制

- 输出 mp4（**带音频**），默认 768P / 比例跟随输入图 / 5 秒
- 时长 4–15 秒，分辨率 768P / 2K（当前网关仅支持 768P）
- 首帧、尾帧至少给一张；支持仅首帧 / 仅尾帧 / 首尾帧三种模式
- 英文提示词效果最佳，支持长篇分镜脚本
- 异步任务总耗时通常 3–8 分钟（视排队与负载）
- 下载地址 `task.content.url` 为 OSS 预签名直链，有时效，需及时下载；仅支持查询最近 7 天内的任务
