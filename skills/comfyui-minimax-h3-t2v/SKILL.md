---
name: comfyui-minimax-h3-t2v
description: "通过公网网关使用 MiniMax H3 模型文生视频（fl2va，输出带同步音频的 mp4）。当用户要求文生视频、文字生成视频、MiniMax H3、生成带音频的短视频时使用。"
metadata: { "openclaw": { "emoji": "🎬" } }
---

# ComfyUI MiniMax H3 文生视频

通过公网网关 `https://ai.ospreyai.cn` 调用 **MiniMax H3**（`minimax_h3_fl2va_pruned_int8_convrot`）模型文生视频。

MiniMax H3 原生支持**音视频联合生成**——输出 mp4 自带同步音频轨（环境音/配乐/音效），无需额外 TTS。任务异步执行：提交工作流 → 轮询状态 → 下载结果。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 最简：默认 5 秒 16:9 视频到当前目录
python scripts/text_to_video.py --prompt "A bird spreading its wings and flying away"

# 自定义时长 / 比例 / 种子
python scripts/text_to_video.py \
  --prompt "A slow push-in on the subject" \
  --duration 10 --aspect-ratio "9:16 (Portrait Widescreen)" --seed 42
```

## 工作原理

- **核心节点**：`MiniMaxH3ImageToVideo`（`105:104`），T2V 模式不接 `first_frame` 输入即为纯文生视频
- **模型权重**：`minimax_h3_fl2va_pruned_int8_convrot.safetensors`（fl2va）
- **音视频联合**：`VAEDecode`（视频）+ `VAEDecodeAudio`（音频）→ `CreateVideo` 合成带音频的 mp4
- **时长机制**：`PrimitiveFloat`（`105:111`）控制时长（秒），`ComfyMathExpression`（`105:107`）自动换算帧数（秒 × 24fps）并对齐到 MiniMax H3 帧数约束（帧数 mod 17 = 5）
- **分辨率机制**：`ResolutionSelector`（`115`）按 `aspect_ratio` + `megapixels` + `multiple`（对齐粒度 32）自动算宽高

> 输出**带音频**的 mp4，保存到 ComfyUI output 的 `video/` 子目录。

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--prompt` | 正向提示词（英文，描述镜头/动作/光影/音频，必须） | — |
| `--aspect-ratio` | 宽高比 | `16:9 (Widescreen)` |
| `--megapixels` | 分辨率档位（MP） | `0.4` |
| `--duration` | 视频时长（秒） | `5` |
| `--seed` | 随机种子（可选） | 时间戳随机 |
| `--output-prefix` | 输出文件名前缀（可含子目录） | `video/MiniMax_H3` |
| `--output` | 本地保存路径（可选） | 当前目录，文件名取服务端返回名 |
| `--timeout` | 轮询超时秒数 | `600` |

### Python 脚本

```bash
# 默认 5 秒视频
python scripts/text_to_video.py --prompt "A bird spreading its wings and flying away"

# 10 秒竖屏
python scripts/text_to_video.py --prompt "..." --duration 10 --aspect-ratio "9:16 (Portrait Widescreen)"

# 指定种子复现
python scripts/text_to_video.py --prompt "..." --seed 42
```

### 脚本内部流程

1. 读取 `scripts/workflow.json`，按命令行参数替换提示词、宽高比、分辨率档位、时长、种子、输出前缀
2. `POST /api/v1/ai/video/generate` 提交工作流，拿 `prompt_id`
3. 每 5 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
4. 从 `outputs[].images` 找 mp4 文件，通过 `/api/v1/ai/image/view/` 下载（必须带 `subfolder=video`）

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

视频输出在任务状态 `outputs` 的 **`images`** 字段（文件名 .mp4，同节点有 `animated` 布尔列表标记）。音频已内嵌在 mp4 里。

```bash
# 注意 subfolder=video 必须带上
curl -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=MiniMax_H3_00001_.mp4&type=output&subfolder=video" \
  -o result.mp4
```

**输出：** MP4 视频（**带音频**），16:9，约 5 秒，24fps。

> **缓存坑**：若提交的工作流与某次历史完全相同（尤其 seed 相同），ComfyUI 会命中 `execution_cached` 直接返回缓存结果，`outputs` 可能为空。脚本默认随机 seed 可避免。

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| 500 on generate | 工作流 JSON 格式错 | 确认用 `{"prompt": {...nodes...}, "extra_data": {}}` |
| `node_errors` 非空 | 模型文件缺失 / 分辨率不对齐 | 检查 unet/clip/vae 文件名；`multiple=32` 保持对齐 |
| 任务 success 但 outputs 空 | 命中 ComfyUI 缓存 | 换随机 `noise_seed`（脚本默认已随机） |
| 下载 404 | subfolder 没带 | 视频在 `video/` 子目录，下载 URL 的 `subfolder=video` 必须带上 |
| outputs 里找不到视频 | 找错字段 | 视频在 `outputs[].images`（mp4 + `animated` 标记），不是 `gifs` |

## 限制

- 输出**带音频** mp4，默认 16:9 / 5 秒 / 24fps
- 大幅提高分辨率或时长会显著增加生成时间和显存占用
- 英文提示词效果最佳，支持长篇分镜脚本
- 异步任务总耗时通常 1–3 分钟（视分辨率与排队）
