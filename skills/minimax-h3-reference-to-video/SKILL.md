---
name: minimax-h3-reference-to-video
description: "通过 Osprey 官方 MiniMax H3 V2 多模态参考接口，使用参考图片、视频、音频生成视频并下载 mp4。当用户要求参考生视频、参考图生成视频、用参考素材生成视频、多模态参考生成时使用。"
metadata: { "openclaw": { "emoji": "🎞️" } }
---

# MiniMax H3 多模态参考生视频

通过 Osprey 官方 MiniMax H3 V2 接口 `https://open.ospreyai.cn` 创建参考生视频任务。

通过 `content` 数组传入 `reference_image`、`reference_video`、`reference_audio`，配合提示词生成带同步音频的视频。MiniMax H3 原生支持**音视频联合生成**，输出 mp4 自带音频轨。任务异步执行：提交任务 → 轮询状态 → 下载结果。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 2 张参考图，默认 768P / adaptive / 5 秒
python scripts/reference_to_video.py \
  --ref0 character.png --ref1 scene.png \
  --prompt "Use the reference images for the character and environment; create a cinematic shot." \
  --duration 5 --output ./output.mp4

# 参考视频 + 参考音频（公网 URL）
python scripts/reference_to_video.py \
  --ref0 character.png --ref1 scene.png \
  --ref-video-url https://example.com/motion.mp4 \
  --ref-audio-url https://example.com/voice.mp3 \
  --prompt "The character speaks with the voice reference and follows the motion reference." \
  --ratio adaptive --duration 8 --output ./output.mp4
```

## 参考素材

通过 `content` 数组按角色传入：

| 参数 | 角色 role | 类型 | 说明 |
|------|-----------|------|------|
| `--ref0` | `reference_image` | 图片 | 参考图 1（必须） |
| `--ref1` | `reference_image` | 图片 | 参考图 2（必须） |
| `--ref-image` | `reference_image` | 图片 | 额外参考图，可重复 |
| `--ref-video-url` | `reference_video` | 视频 | 参考视频 URL，可重复 |
| `--ref-audio-url` | `reference_audio` | 音频 | 参考音频 URL，可重复 |

- 本地参考图片：脚本自动转 `data:` URI
- 图片也可用 `pic.ospreyai.cn` 转公网 URL 后传入 `--ref0` / `--ref1` / `--ref-image`
- 视频、音频必须是公网 URL、`mm_file://` 或 `data:` URI
- **混合参考素材总数最多 12 个**（含 `--ref0` / `--ref1`）

## 工作原理

- **接口**：官方 MiniMax H3 V2 —— `POST /v2/video_generation`（提交）+ `GET /v2/query/video_generation/{task_id}`（查询）
- **请求体**：`model=MiniMax-H3`，`content` 数组含提示词文本 + 各角色参考项
  - `{"type":"image_url","image_url":{"url":...},"role":"reference_image"}`
  - `{"type":"video_url","video_url":{"url":...},"role":"reference_video"}`
  - `{"type":"audio_url","audio_url":{"url":...},"role":"reference_audio"}`
- **音视频联合**：MiniMax H3 原生生成，输出 mp4 自带同步音频轨
- **异步任务**：提交返回 `task_id`，轮询直到 `task.status=succeeded`，从 `task.content.url` 取视频地址下载（OSS 预签名直链，无需 token，有时效）

> 视频生成较慢，通常 3–8 分钟（视排队与负载）。

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--ref0` | 参考图 1 路径或公网 URL（必须） | — |
| `--ref1` | 参考图 2 路径或公网 URL（必须） | — |
| `--ref-image` | 额外参考图，可重复 | — |
| `--ref-video-url` | 参考视频 URL，可重复 | — |
| `--ref-audio-url` | 参考音频 URL，可重复 | — |
| `--prompt` | 视频描述及参考素材使用方式（最多 7000 字符，必须） | — |
| `--resolution` | 分辨率：`768P` / `2K`（当前网关仅支持 768P，2K 暂不可用） | `768P` |
| `--ratio` | 画面比例（默认 `adaptive`） | `adaptive` |
| `--duration` | 视频时长（4–15 秒整数） | `5` |
| `--output` | 本地 mp4 保存路径 | 当前目录 `minimax_h3_r2v.mp4` |
| `--timeout` | 轮询超时秒数 | `600` |
| `--gw` | 网关地址 | 环境变量 `GW` |
| `--api-key` | 网关 API key（`sk-xxx`） | 环境变量 `API_KEY` |

> `--aspect-ratio` 是 `--ratio` 的别名，兼容旧写法。

### Python 脚本

```bash
# 2 张参考图
python scripts/reference_to_video.py --ref0 ref0.png --ref1 ref1.png \
  --prompt "Use <Picture 1> and <Picture 2> as reference. CUT 1: the hero on the rooftop. CUT 2: the mech roaring."

# 加参考视频/音频
python scripts/reference_to_video.py --ref0 a.png --ref1 b.png \
  --ref-video-url https://example.com/motion.mp4 \
  --ref-audio-url https://example.com/voice.mp3 \
  --prompt "Character speaks with the voice reference and follows the motion." --duration 8

# 多张额外参考图
python scripts/reference_to_video.py --ref0 a.png --ref1 b.png \
  --ref-image c.png --ref-image d.png --prompt "..."
```

### 脚本内部流程

1. 本地参考图片转 `data:` URI（URL 原样透传），校验视频/音频为 URL/URI
2. 按顺序组装 `content` 数组：文本 + 参考图 + 参考视频 + 参考音频
3. `POST /v2/video_generation` 提交任务，拿 `task_id`
4. 每 10 秒轮询 `GET /v2/query/video_generation/{task_id}`，读 `task.status`
5. `status=succeeded` 后从 `task.content.url` 下载 mp4 到 `--output`

## 提示词技巧

MiniMax H3 的文本编码器基于 Qwen3-VL，**支持长篇分镜脚本**，可包含：

- 整体风格 + 场景概述
- 用 `<Picture 1>` / `<Picture 2>` 指代参考图（建议，否则参考内容可能不出现）
- 逐镜头分镜（`CUT 1: ...`、`CUT 2: ...`）
- 运镜、光影、质感描述
- 音频提示（`Audio: wind, footsteps, low score...`）——模型会据此处生成同步音轨

## 下载结果

任务成功后，视频地址在 `task.content.url`（OSS 预签名直链，无需 token，有时效），脚本自动下载到 `--output`。也可手动 curl：

```bash
curl -L "$VIDEO_URL" -o result.mp4
```

**输出：** MP4 视频（**带音频**），默认 768P / 比例 adaptive / 约 5 秒。

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| 参考图不存在 | 本地路径错 | 检查 `--ref0` / `--ref1` 路径，或改用 URL |
| 参考视频/音频报错 | 非公网 URL | 必须是 `http(s)://` / `mm_file://` / `data:` URI |
| 参考素材超限 | 超过 12 个 | 减少素材数量（含 ref0/ref1） |
| 创建任务未返回 task_id | 网关异常 | 检查 `GW` 地址、网络，看返回体 |
| 任务 failed | 内容审核 / 参数非法 | 看 `task.error`，调整 prompt |
| 轮询超时 | 生成排队久 | 调大 `--timeout` |
| 下载 404 / 链接失效 | `task.content.url` 有时效 | 任务完成后及时下载；URL 失效可重新查询任务获取新链接 |

## 限制

- 输出 mp4（**带音频**），默认 768P / 比例 adaptive / 5 秒
- 时长 4–15 秒，分辨率 768P / 2K（当前网关仅支持 768P）
- 至少 2 张参考图（`--ref0` / `--ref1`），混合参考素材总数最多 12 个
- 英文提示词效果最佳，支持长篇分镜脚本
- 异步任务总耗时通常 3–8 分钟（视排队与负载）
- 下载地址 `task.content.url` 为 OSS 预签名直链，有时效，需及时下载；仅支持查询最近 7 天内的任务
