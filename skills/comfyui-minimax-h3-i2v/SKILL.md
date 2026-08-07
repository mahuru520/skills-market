---
name: comfyui-minimax-h3-i2v
description: "通过公网网关使用 MiniMax H3 模型图生视频（fl2va，以上传图片为首帧，输出带同步音频的 mp4）。当用户要求图生视频、图片生成视频、首帧生成视频、MiniMax H3、让图片动起来时使用。"
metadata: { "openclaw": { "emoji": "🖼️" } }
---

# ComfyUI MiniMax H3 图生视频

通过公网网关 `https://ai.ospreyai.cn` 调用 **MiniMax H3**（`minimax_h3_fl2va_pruned_int8_convrot`）模型图生视频。

上传一张图片作**首帧**，配合提示词生成带同步音频的动态视频。MiniMax H3 原生支持**音视频联合生成**——输出 mp4 自带音频轨（环境音/配乐/音效），无需额外 TTS。任务异步执行：上传图片 → 提交工作流 → 轮询状态 → 下载结果。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 最简：上传图片作首帧，默认 5 秒 9:16 视频
python scripts/image_to_video.py --image input.png --prompt "A slow push-in on the subject"

# 自定义时长 / 比例 / 种子
python scripts/image_to_video.py \
  --image input.png --prompt "..." \
  --duration 10 --aspect-ratio "16:9 (Widescreen)" --seed 42
```

## 工作原理

- **核心节点**：`MiniMaxH3ImageToVideo`（`105:104`），`first_frame` 接到 LoadImage（`114`）即图生视频模式
- **模型权重**：`minimax_h3_fl2va_pruned_int8_convrot.safetensors`（fl2va，与 T2V 相同）
- **音视频联合**：`VAEDecode`（视频）+ `VAEDecodeAudio`（音频）→ `CreateVideo` 合成带音频的 mp4
- **时长机制**：`PrimitiveFloat`（`105:111`）控制时长（秒），`ComfyMathExpression`（`105:107`）自动换算帧数（秒 × 24fps）并对齐到 MiniMax H3 帧数约束（帧数 mod 17 = 5）
- **分辨率机制**：`ResolutionSelector`（`115`）按 `aspect_ratio` + `megapixels` + `multiple`（对齐粒度 32）自动算宽高；首帧图片经 `ImageScaleToTotalPixels`/`GetImageSize` 处理后接入

> 输出**带音频**的 mp4，保存到 ComfyUI output 的 `video/` 子目录。

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--image` | 输入图片路径（作首帧，必须） | — |
| `--prompt` | 正向提示词（英文，描述运镜/动作/音频，必须） | — |
| `--aspect-ratio` | 宽高比 | `9:16 (Portrait Widescreen)` |
| `--megapixels` | 分辨率档位（MP） | `0.5` |
| `--duration` | 视频时长（秒） | `5` |
| `--seed` | 随机种子（可选） | 时间戳随机 |
| `--output-prefix` | 输出文件名前缀（可含子目录） | `video/MiniMax_H3` |
| `--output` | 本地保存路径（可选） | 当前目录，文件名取服务端返回名 |
| `--timeout` | 轮询超时秒数 | `600` |

### Python 脚本

```bash
# 默认 5 秒竖屏
python scripts/image_to_video.py --image portrait.png --prompt "A slow push-in on the subject"

# 10 秒横屏
python scripts/image_to_video.py --image landscape.png --prompt "..." --duration 10 --aspect-ratio "16:9 (Widescreen)"

# 指定种子复现
python scripts/image_to_video.py --image input.png --prompt "..." --seed 42
```

### 脚本内部流程

1. `POST /api/v1/upload` 上传输入图片（multipart 字段 `image`），拿返回的 `name`
2. 读取 `scripts/workflow.json`，按命令行参数替换图片名、提示词、宽高比、分辨率档位、时长、种子、输出前缀
3. `POST /api/v1/ai/video/generate` 提交工作流，拿 `prompt_id`
4. 每 5 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
5. 从 `outputs[].images` 找 mp4 文件，通过 `/api/v1/ai/image/view/` 下载（必须带 `subfolder=video`）

## 提示词技巧

MiniMax H3 的文本编码器基于 Qwen3-VL，**支持长篇分镜脚本**，可包含：

- 整体风格 + 场景概述
- 逐镜头分镜（`[0s-1.5s] Shot 1: ...`）
- 运镜、光影、质感描述
- 音频提示（`Audio: wind, footsteps, low score...`）——模型会据此处生成同步音轨

首帧图片决定起始画面，提示词驱动后续运镜与变化。

## 下载结果

视频输出在任务状态 `outputs` 的 **`images`** 字段（文件名 .mp4，同节点有 `animated` 布尔列表标记）。音频已内嵌在 mp4 里。

```bash
# 注意 subfolder=video 必须带上
curl -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=MiniMax_H3_00001_.mp4&type=output&subfolder=video" \
  -o result.mp4
```

**输出：** MP4 视频（**带音频**），约 5 秒，24fps。

> **缓存坑**：若提交的工作流与某次历史完全相同（尤其 seed 相同），ComfyUI 会命中 `execution_cached` 直接返回缓存结果，`outputs` 可能为空。脚本默认随机 seed 可避免。

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| `node_errors` 提示图片缺失 | 图片未上传/文件名错 | 脚本已自动上传，检查 `--image` 路径是否正确 |
| 500 on generate | 工作流 JSON 格式错 | 确认用 `{"prompt": {...nodes...}, "extra_data": {}}` |
| 任务 success 但 outputs 空 | 命中 ComfyUI 缓存 | 换随机 `noise_seed`（脚本默认已随机） |
| 下载 404 | subfolder 没带 | 视频在 `video/` 子目录，下载 URL 的 `subfolder=video` 必须带上 |
| 首帧被拉伸 | aspect_ratio 与图片比例不一致 | `--aspect-ratio` 选与输入图一致的比例 |

## 限制

- 输出**带音频** mp4，默认 9:16 / 5 秒 / 24fps
- 输入图片作首帧，建议 aspect_ratio 与图片比例一致
- 大幅提高分辨率或时长会显著增加生成时间和显存占用
- 英文提示词效果最佳，支持长篇分镜脚本
- 异步任务总耗时通常 1–3 分钟（视分辨率与排队）
