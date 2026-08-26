---
name: minimax-h3-text-to-video
description: "通过 Osprey 官方 MiniMax H3 V2 接口使用文本生成视频并下载 mp4。当用户要求文生视频、文字生成视频、MiniMax H3、生成短视频时使用。"
metadata: { "openclaw": { "emoji": "🎬" } }
---

# MiniMax H3 文生视频

通过 Osprey 官方 MiniMax H3 V2 接口 `https://open.ospreyai.cn` 创建文生视频任务。

MiniMax H3 原生支持**音视频联合生成**，输出 mp4 自带同步音频轨（环境音/配乐/音效），无需额外 TTS。任务异步执行：提交任务 → 轮询状态 → 下载结果。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 最简：默认 768P / 16:9 / 5 秒视频到当前目录
python scripts/text_to_video.py --prompt "A bird spreading its wings and flying away"

# 自定义分辨率 / 比例 / 时长
python scripts/text_to_video.py \
  --prompt "A cinematic slow push-in on a rainy street" \
  --resolution 768P --ratio 16:9 --duration 5 \
  --output ./output.mp4 --timeout 600
```

## 工作原理

- **接口**：官方 MiniMax H3 V2 —— `POST /v2/video_generation`（提交）+ `GET /v2/query/video_generation/{task_id}`（查询）
- **请求体**：`model=MiniMax-H3`，提示词放进 `content` 数组（`{"type":"text","text":...}`）
- **音视频联合**：MiniMax H3 原生生成，输出 mp4 自带同步音频轨
- **异步任务**：提交返回 `task_id`，轮询直到 `task.status=succeeded`，通过带鉴权下载接口 `GET /v1/videos/{task_id}/content` 取视频

> 视频生成较慢，通常 3–8 分钟（视排队与负载）。

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--prompt` | 视频描述提示词（最多 7000 字符，必须） | — |
| `--resolution` | 分辨率：`768P` / `2K` | `768P` |
| `--ratio` | 画面比例：`21:9` `16:9` `4:3` `1:1` `3:4` `9:16` | `16:9` |
| `--duration` | 视频时长（4–15 秒整数） | `5` |
| `--output` | 本地 mp4 保存路径 | 当前目录 `minimax_h3_t2v.mp4` |
| `--timeout` | 轮询超时秒数 | `600` |
| `--gw` | 网关地址 | 环境变量 `GW` |
| `--api-key` | 网关 API key（`sk-xxx`） | 环境变量 `API_KEY` |

### Python 脚本

```bash
# 默认 768P 横屏 5 秒
python scripts/text_to_video.py --prompt "A bird spreading its wings and flying away"

# 竖屏 10 秒
python scripts/text_to_video.py --prompt "..." --ratio 9:16 --duration 10

# 2K 高清
python scripts/text_to_video.py --prompt "..." --resolution 2K
```

### 脚本内部流程

1. `POST /v2/video_generation` 提交任务，拿 `task_id`
2. 每 10 秒轮询 `GET /v2/query/video_generation/{task_id}`，读 `task.status`
3. `status=succeeded` 后通过 `GET /v1/videos/{task_id}/content`（带 API Key）下载 mp4 到 `--output`

## 提示词技巧

MiniMax H3 的文本编码器基于 Qwen3-VL，**支持长篇分镜脚本**，可包含：

- 整体风格 + 场景概述
- 逐镜头分镜（`[0s-1.5s] Shot 1: ...`）
- 运镜、光影、质感描述
- 音频提示（`Audio: wind, footsteps, low score...`）——模型会据此处生成同步音轨

```
Realistic live-action cinematic look, action movie trailer...
Scene overview: ...
Storyboard (each shot a separate scene, rapid cuts):
[0s-1.5s] Shot 1: ...
[1s-2.5s] Shot 2: ...
Audio: wind, rapid footsteps, city ambience, low score underneath...
```

## 下载结果

任务成功后，脚本通过带鉴权接口 `GET /v1/videos/{task_id}/content`（需 `Authorization: Bearer sk-xxx`）下载视频到 `--output`。也可手动 curl：

```bash
curl -H "Authorization: Bearer $API_KEY" \
  "$GW/v1/videos/$TASK_ID/content" -o result.mp4
```

**输出：** MP4 视频（**带音频**），默认 768P / 16:9 / 约 5 秒。

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| 创建任务未返回 task_id | 网关异常 | 检查 `GW` 地址、网络，看返回体 |
| 任务 failed | 内容审核 / 参数非法 | 看 `task.error`，调整 prompt |
| 轮询超时 | 生成排队久 | 调大 `--timeout` |
| 下载 401 | 下载接口未带 API Key | `/v1/videos/{task_id}/content` 必须带 `Authorization` |

## 限制

- 输出 mp4（**带音频**），默认 768P / 16:9 / 5 秒
- 时长 4–15 秒，分辨率 768P / 2K
- 英文提示词效果最佳，支持长篇分镜脚本
- 异步任务总耗时通常 3–8 分钟（视排队与负载）
- 下载接口需带 API Key，仅支持查询最近 7 天内的任务
