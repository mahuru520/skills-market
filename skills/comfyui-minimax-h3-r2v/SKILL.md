---
name: comfyui-minimax-h3-r2v
description: "通过公网网关使用 MiniMax H3 模型参考生视频（ref2va，上传 2 张参考图作视觉参考生成全新视频，输出带同步音频的 mp4）。当用户要求参考生视频、参考图生成视频、MiniMax H3 参考生成、用参考图生成视频时使用。"
metadata: { "openclaw": { "emoji": "🎞️" } }
---

# ComfyUI MiniMax H3 参考生视频

通过公网网关 `https://ai.ospreyai.cn` 调用 **MiniMax H3**（`minimax_h3_ref2va_pruned_int8_convrot`）模型参考生视频。

上传 **2 张参考图**作视觉参考（角色/风格/场景），配合提示词生成**全新视频**——非首帧延展，而是参考再生。R2V 使用独立的 **ref2va** 权重（区别于 T2V/I2V 的 fl2va）。MiniMax H3 原生支持**音视频联合生成**，输出 mp4 自带同步音频轨。任务异步执行：上传参考图 → 提交工作流 → 轮询状态 → 下载结果。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 最简：上传 2 张参考图，默认 5 秒 16:9 视频
python scripts/reference_to_video.py \
  --ref0 ref0.png --ref1 ref1.png \
  --prompt "Use <Picture 1> and <Picture 2> as reference. CUT 1: ..."

# 自定义时长 / 比例 / 种子
python scripts/reference_to_video.py \
  --ref0 ref0.png --ref1 ref1.png --prompt "..." \
  --duration 10 --aspect-ratio "9:16 (Portrait Widescreen)" --seed 42
```

## 工作原理

- **核心节点**：`MiniMaxH3ReferenceToVideo`（`136`），接 2 张参考图（`ref_images.ref_image_0` ← `137`，`ref_images.ref_image_1` ← `139`）+ 提示词（`prompt` ← `138`）
- **模型权重**：`minimax_h3_ref2va_pruned_int8_convrot.safetensors`（ref2va，**与 T2V/I2V 的 fl2va 不同**）
- **音视频联合**：`VAEDecode`（视频，vae=`119`）+ `VAEDecodeAudio`（音频，vae=`120`）→ `CreateVideo` 合成带音频的 mp4
- **时长机制**：`PrimitiveFloat`（`132`）控制时长（秒），`ComfyMathExpression`（`131`）自动换算帧数（秒 × 24fps）并对齐到 MiniMax H3 帧数约束（帧数 mod 17 = 5）
- **分辨率机制**：`ResolutionSelector`（`115`）按 `aspect_ratio` + `megapixels` + `multiple`（对齐粒度 32）自动算宽高

> 输出**带音频**的 mp4，保存到 ComfyUI output 的 `video/` 子目录。

## 参考图引用规则

- `--ref0`（节点 `137`）= 提示词中的 **`<Picture 1>`**
- `--ref1`（节点 `139`）= 提示词中的 **`<Picture 2>`**
- 参考图是**视觉参考**（角色/风格/场景），**不是首帧**；模型据其生成新内容
- 提示词里必须用 `<Picture 1>`/`<Picture 2>` 指代参考图，否则参考内容不会出现

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--ref0` | 参考图 1 路径（= `<Picture 1>`，必须） | — |
| `--ref1` | 参考图 2 路径（= `<Picture 2>`，必须） | — |
| `--prompt` | 正向提示词（用 `<Picture 1>/<Picture 2>` 引用，必须） | — |
| `--aspect-ratio` | 宽高比 | `16:9 (Widescreen)` |
| `--megapixels` | 分辨率档位（MP） | `0.4` |
| `--duration` | 视频时长（秒） | `5` |
| `--seed` | 随机种子（可选） | 时间戳随机 |
| `--output-prefix` | 输出文件名前缀（可含子目录） | `video/MiniMax_H3` |
| `--output` | 本地保存路径（可选） | 当前目录，文件名取服务端返回名 |
| `--timeout` | 轮询超时秒数 | `600` |

### Python 脚本

```bash
# 默认 5 秒横屏
python scripts/reference_to_video.py --ref0 ref0.png --ref1 ref1.png \
  --prompt "Use <Picture 1> and <Picture 2> as reference. CUT 1: the hero on the rooftop. CUT 2: the giant mech roaring."

# 10 秒竖屏
python scripts/reference_to_video.py --ref0 a.png --ref1 b.png --prompt "..." \
  --duration 10 --aspect-ratio "9:16 (Portrait Widescreen)"

# 指定种子复现
python scripts/reference_to_video.py --ref0 a.png --ref1 b.png --prompt "..." --seed 42
```

### 脚本内部流程

1. `POST /api/v1/upload` 依次上传 2 张参考图（multipart 字段 `image`），拿返回的 `name`
2. 读取 `scripts/workflow.json`，按命令行参数替换 2 张参考图名、提示词、宽高比、分辨率档位、时长、种子、输出前缀
3. `POST /api/v1/ai/video/generate` 提交工作流，拿 `prompt_id`
4. 每 5 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
5. 从 `outputs[].images` 找 mp4 文件，通过 `/api/v1/ai/image/view/` 下载（必须带 `subfolder=video`）

## 提示词技巧

MiniMax H3 的文本编码器基于 Qwen3-VL，**支持长篇分镜脚本**，可包含：

- 整体风格 + 场景概述
- 用 `<Picture 1>`/`<Picture 2>` 指代参考图（**必填**，否则参考内容不出现）
- 逐镜头分镜（`CUT 1: ...`、`CUT 2: ...`）
- 运镜、光影、质感描述
- 音频提示（`Audio: wind, footsteps, low score...`）——模型会据此处生成同步音轨

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
| `node_errors` 提示图片缺失 | 参考图未上传/文件名错 | 脚本已自动上传，检查 `--ref0`/`--ref1` 路径 |
| `node_errors` 提示模型缺失 | 用错 unet | R2V 必须用 `minimax_h3_ref2va_pruned_int8_convrot`（ref2va），不是 fl2va |
| 参考图角色没出现 | 提示词没引用 `<Picture N>` | 在 `--prompt` 里用 `<Picture 1>`/`<Picture 2>` 指代参考图 |
| 500 on generate | 工作流 JSON 格式错 | 确认用 `{"prompt": {...nodes...}, "extra_data": {}}` |
| 任务 success 但 outputs 空 | 命中 ComfyUI 缓存 | 换随机 `noise_seed`（脚本默认已随机） |
| 下载 404 | subfolder 没带 | 视频在 `video/` 子目录，下载 URL 的 `subfolder=video` 必须带上 |

## 限制

- 输出**带音频** mp4，默认 16:9 / 5 秒 / 24fps
- 需上传 2 张参考图，参考图是视觉参考非首帧
- 必须用 ref2va 权重（与 T2V/I2V 的 fl2va 不通用）
- 大幅提高分辨率或时长会显著增加生成时间和显存占用
- 英文提示词效果最佳，支持长篇分镜脚本
- 异步任务总耗时通常 1–3 分钟（视分辨率与排队）
