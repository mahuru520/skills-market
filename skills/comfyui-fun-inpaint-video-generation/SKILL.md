---
name: comfyui-fun-inpaint-video-generation
description: 通过公网网关使用 ComfyUI API 进行 Wan 2.2 Fun Inpaint 首尾帧视频生成。覆盖首帧/尾帧图片上传、工作流提交、队列/任务状态查询、MP4 视频下载的完整流程。
metadata:
  version: "1.0"
  category: video-generation
triggers:
  - Fun Inpaint 视频
  - 首尾帧视频
  - 首帧尾帧
  - comfyui fun inpaint
  - WanFunInpaintToVideo
  - 首尾图生成视频
  - inpaint video
  - 首尾过渡
---

# ComfyUI Wan 2.2 Fun Inpaint 首尾帧视频生成

## Overview

通过公网网关 `https://ai.ospreyai.cn` 使用 ComfyUI 将 **首帧 + 尾帧两张图片** 生成一段过渡视频。

使用 **Wan 2.2 Fun Inpaint + LightX2V 4 步加速** 工作流，核心节点 `WanFunInpaintToVideo` 接收首帧（start_image）和尾帧（end_image），自动补间生成从起始画面到结束画面的平滑过渡动画（640×640, 16fps, 81帧, ~5 秒）。

核心特性：
- **首尾帧控制**：精确从 start_image 过渡到 end_image
- **Fun Inpaint 模型**：Wan 2.2 专为 inpaint 场景优化的扩散模型，比标准 I2V 更适合首尾帧补间
- **双 UNET 采样**：高噪声 + 低噪声模型分阶段采样，画质更稳定
- **LightX2V 4 步加速**：LoRA 加速仅需 4 步采样，生成速度快
- **采样偏移 shift=8**：比标准 I2V（shift=5）更高的偏移值，适合首尾帧长距离过渡

与其他视频生成 Skill 的对比：

| Skill | 核心节点 | 输入 | 输出 | 适用场景 |
|-------|---------|------|------|---------|
| [图生视频](../comfyui-video-generation) | WanImageToVideo | 1 张起始图 | ~5s 视频 | 从单图生成动态视频 |
| [6 关键帧视频](../comfyui-keyframes-video-generation) | WanFirstLastFrameToVideo ×5 | 6 张关键帧 | ~5s 视频 | 多关键帧过渡 |
| **本 Skill** | WanFunInpaintToVideo | 首帧 + 尾帧 | ~5s 视频 | 两张图之间的精确过渡 |

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)

# 1. 上传首帧和尾帧图片
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@$OUT/start.png" -F "overwrite=true"
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@$OUT/end.png" -F "overwrite=true"

# 2. 提交 Fun Inpaint 视频工作流（完整 JSON 见下方 Route A）
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/ai/video/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'

# 3. 查询任务状态
curl -s -H "Authorization: Bearer $API_KEY" "$GW/api/v1/ai/tasks/{prompt_id}"

# 4. 下载 MP4 视频（注意 subfolder=video）
curl -s -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=output.mp4&subfolder=video&type=output" \
  -o "$OUT/output.mp4"
```

> 保存路径通过 `get-output-dir.sh` 获取，由 `user-initialization` 技能统一约定输出目录。

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次生成首尾帧视频 | → Route A: Upload & Generate |
| 需要查看任务是否完成 | → Route B: Check Status |
| 需要获取或下载 MP4 | → Route C: Download |
| 需要调优提示词、帧数或尺寸 | → Route D: Tune Parameters |
| 需要排查服务、节点、模型或文件问题 | → Route E: Troubleshoot |

## Route A: Upload & Generate

### 服务信息

- 网关地址: `https://ai.ospreyai.cn`
- 上传接口: `POST /api/v1/upload`
- 提交接口: `POST /api/v1/ai/video/generate`
- 鉴权方式: `Authorization: Bearer sk-xxx`

### 基本流程

1. 上传首帧（start）和尾帧（end）两张图片到 ComfyUI
2. 提交 Fun Inpaint 视频工作流
3. 工作流包含 17 个节点：
   - 2 × `LoadImage` — 加载首帧和尾帧图片
   - `WanFunInpaintToVideo` — 首尾帧转视频核心节点
   - `CreateVideo` — 创建视频，设置帧率
   - `SaveVideo` — 保存视频为 MP4
   - 其他 13 个节点 — CLIP/VAE/UNet 加载、LoRA 加速、双 KSamplerAdvanced 采样等

### Step 1: 上传首帧和尾帧图片

```bash
# 上传首帧图片
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@$OUT/start.png" \
  -F "overwrite=true"

# 上传尾帧图片
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@$OUT/end.png" \
  -F "overwrite=true"
```

**响应（每次上传）：**

```json
{"name": "start.png", "subfolder": "", "type": "input"}
```

> 记住两个返回的 `name` 值，工作流中 LoadImage 节点需要使用。

最大文件大小: 50MB。推荐使用 PNG 格式，两张图片尺寸应一致（建议 640×640）。

### Step 2: 提交 Fun Inpaint 视频工作流

```bash
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/ai/video/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "90": {"inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}, "class_type": "CLIPLoader"},
      "91": {"inputs": {"text": "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸变的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走", "clip": ["90", 0]}, "class_type": "CLIPTextEncode"},
      "92": {"inputs": {"vae_name": "wan_2.1_vae.safetensors"}, "class_type": "VAELoader"},
      "93": {"inputs": {"shift": 8, "model": ["116", 0]}, "class_type": "ModelSamplingSD3"},
      "94": {"inputs": {"shift": 8, "model": ["117", 0]}, "class_type": "ModelSamplingSD3"},
      "95": {"inputs": {"add_noise": "disable", "noise_seed": 0, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "start_at_step": 2, "end_at_step": 4, "return_with_leftover_noise": "disable", "model": ["94", 0], "positive": ["111", 0], "negative": ["111", 1], "latent_image": ["96", 0]}, "class_type": "KSamplerAdvanced"},
      "96": {"inputs": {"add_noise": "enable", "noise_seed": 42, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "start_at_step": 0, "end_at_step": 2, "return_with_leftover_noise": "enable", "model": ["93", 0], "positive": ["111", 0], "negative": ["111", 1], "latent_image": ["111", 2]}, "class_type": "KSamplerAdvanced"},
      "97": {"inputs": {"samples": ["95", 0], "vae": ["92", 0]}, "class_type": "VAEDecode"},
      "99": {"inputs": {"text": "你的正向提示词（英文动作描述）", "clip": ["90", 0]}, "class_type": "CLIPTextEncode"},
      "100": {"inputs": {"fps": 16, "images": ["97", 0]}, "class_type": "CreateVideo"},
      "101": {"inputs": {"unet_name": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
      "102": {"inputs": {"unet_name": "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
      "110": {"inputs": {"image": "你的首帧图片.png"}, "class_type": "LoadImage"},
      "111": {"inputs": {"width": 640, "height": 640, "length": 81, "batch_size": 1, "positive": ["99", 0], "negative": ["91", 0], "vae": ["92", 0], "start_image": ["110", 0], "end_image": ["112", 0]}, "class_type": "WanFunInpaintToVideo"},
      "112": {"inputs": {"image": "你的尾帧图片.png"}, "class_type": "LoadImage"},
      "116": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors", "strength_model": 1, "model": ["101", 0]}, "class_type": "LoraLoaderModelOnly"},
      "117": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors", "strength_model": 1, "model": ["102", 0]}, "class_type": "LoraLoaderModelOnly"},
      "158": {"inputs": {"filename_prefix": "video/fun_inpaint", "format": "auto", "codec": "auto", "video": ["100", 0]}, "class_type": "SaveVideo"}
    }
  }'
```

**响应：**

```json
{"prompt_id": "e1f2a3b4-...", "number": 150, "node_errors": {}}
```

> `node_errors` 为空对象 `{}` 表示工作流校验通过。如有错误会在此列出。

**使用前需修改：**

| 节点 | 字段 | 修改为 |
|------|------|--------|
| 99 | text | 你的正向提示词（英文动作描述） |
| 110 | image | 首帧图片上传返回的 `name` 值 |
| 112 | image | 尾帧图片上传返回的 `name` 值 |
| 158 | filename_prefix | 输出文件名前缀，如 `"video/my_fun_inpaint"` |

### 节点说明

| 节点 ID | class_type | 功能 |
|---------|-----------|------|
| 90 | CLIPLoader | 加载 Wan 的 CLIP 模型（文本编码器） |
| 91 | CLIPTextEncode | 负向提示词编码（中文质量排除词） |
| 92 | VAELoader | 加载 VAE 模型 |
| 93 | ModelSamplingSD3 | 高噪声模型采样偏移调整（shift=8） |
| 94 | ModelSamplingSD3 | 低噪声模型采样偏移调整（shift=8） |
| 95 | KSamplerAdvanced | 后半段采样（去噪，步骤 2→4，低噪声模型） |
| 96 | KSamplerAdvanced | 前半段采样（加噪，步骤 0→2，高噪声模型） |
| 97 | VAEDecode | VAE 解码 latent → 像素帧 |
| 99 | CLIPTextEncode | 正向提示词编码（英文动作描述） |
| 100 | CreateVideo | 创建视频，设置帧率 |
| 101 | UNETLoader | 加载高噪声 UNet 模型 |
| 102 | UNETLoader | 加载低噪声 UNet 模型 |
| 110 | LoadImage | 加载首帧图片 |
| 111 | WanFunInpaintToVideo | **首尾帧转视频核心节点** |
| 112 | LoadImage | 加载尾帧图片 |
| 116 | LoraLoaderModelOnly | 加载高噪声 LoRA（4 步加速） |
| 117 | LoraLoaderModelOnly | 加载低噪声 LoRA（4 步加速） |
| 158 | SaveVideo | 保存视频为 MP4 |

### 关键参数

| 节点 | 字段 | 说明 | 示例值 |
|------|------|------|--------|
| 110 | image | 首帧图片文件名（需先上传） | `"start.png"` |
| 112 | image | 尾帧图片文件名（需先上传） | `"end.png"` |
| 99 | text | 正向提示词（英文动作描述） | `"A cat waking up and stretching"` |
| 111 | width / height | 视频尺寸 | 640 × 640 |
| 111 | length | 视频帧数（81帧≈5秒@16fps） | 81 |
| 100 | fps | 帧率 | 16 |
| 96 | noise_seed | 随机种子（不同值生成不同视频） | 42 |
| 93/94 | shift | 采样偏移（Fun Inpaint 默认 8） | 8 |
| 158 | filename_prefix | 输出文件名前缀 | `"video/fun_inpaint"` |

### 输出视频参数

- **分辨率**: 640 × 640
- **帧数**: 81 帧
- **帧率**: 16 fps
- **时长**: 约 5 秒
- **格式**: MP4
- **输出路径**: `subfolder=video`, `type=output`

## Route B: Check Status

### 查询队列

```bash
curl -s -H "Authorization: Bearer $API_KEY" "$GW/api/v1/ai/queue"
```

**响应：**

```json
{
  "queue_running": [[150, "e1f2a3b4-...", {...}]],
  "queue_pending": []
}
```

- `queue_running` 不为空 → 任务正在执行
- `queue_pending` 不为空 → 任务排队等待

### 查询任务状态

```bash
curl -s -H "Authorization: Bearer $API_KEY" "$GW/api/v1/ai/tasks/{prompt_id}"
```

**进行中：**

```json
{
  "e1f2a3b4-...": {
    "status": {"status_str": "success", "completed": false},
    "outputs": {}
  }
}
```

**已完成：**

```json
{
  "e1f2a3b4-...": {
    "status": {"status_str": "success", "completed": true},
    "outputs": {
      "158": {
        "images": [{"filename": "fun_inpaint_00001_.mp4", "subfolder": "video", "type": "output"}],
        "animated": [true]
      }
    }
  }
}
```

> 视频生成通常需要 30 秒至 2 分钟（取决于 GPU 和队列情况）。

## Route C: Download

下载前先从任务状态中获取输出文件信息（`filename`, `subfolder`, `type`），然后通过查看接口下载。

```bash
# 下载 MP4 视频（注意 subfolder=video）
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)
curl -s -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=fun_inpaint_00001_.mp4&subfolder=video&type=output" \
  -o "$OUT/output.mp4"
```

**关键点：**

- 视频输出的 `subfolder` 为 `video`（不是空字符串）
- 视频输出的 `type` 为 `output`
- 下载的是 MP4 格式，可直接播放
- 保存路径通过 `get-output-dir.sh` 获取

## Route D: Tune Parameters

| 参数 | 节点 | 建议 |
|------|------|------|
| 首帧图片 | 110 | 推荐 PNG，清晰度越高越好 |
| 尾帧图片 | 112 | 推荐 PNG，尺寸应与首帧一致 |
| 正向提示词 | 99 text | 英文动作描述效果更稳定，如 `"A butterfly emerging from cocoon and spreading wings"` |
| 负向提示词 | 91 text | 默认可保持，避免修改 |
| 视频尺寸 | 111 width/height | 默认 640×640；支持 832×480 等，需为 16 的倍数 |
| 视频帧数 | 111 length | 默认 81（≈5s@16fps）；41≈2.5s, 161≈10s |
| 帧率 | 100 fps | 默认 16；视频时长 = length / fps |
| 随机种子 | 96 noise_seed | 不同值生成不同视频；相同种子 + 相同参数可复现 |
| 采样步数 | 95/96 steps | LightX2V 加速模式下固定 4 步，不建议修改 |
| 采样偏移 | 93/94 shift | 默认 8；Fun Inpaint 专用值，增大更锐利，减小更平滑 |

### 与标准 I2V 工作流的参数差异

| 参数 | 标准 I2V (WanImageToVideo) | Fun Inpaint (WanFunInpaintToVideo) |
|------|--------------------------|------------------------------------|
| 核心节点 | WanImageToVideo | WanFunInpaintToVideo |
| 输入图片 | 仅 start_image | start_image + end_image |
| 采样偏移 shift | 5 | **8** |
| 模型文件 | 相同（wan2.2_i2v_high/low_noise_14B） | 相同 |
| LoRA 加速 | 相同（lightx2v_4steps） | 相同 |
| 输出 | 单张图驱动的自由运动 | 首尾帧约束下的精确过渡 |

## Route E: Troubleshoot

| 问题 | 排查方法 |
|------|---------|
| 上传图片失败 | 检查文件大小（≤50MB）、格式（推荐 PNG）、Bearer Token 是否有效 |
| 工作流提交报 `value_not_in_list` | 模型文件名不正确，检查 UNet/CLIP/VAE/LoRA 名称是否与服务器一致 |
| 工作流提交报 `return_type_mismatch` | 节点间连接类型不匹配，检查节点输出→输入的链接是否正确 |
| 任务长时间未完成 | 检查 `/api/v1/ai/queue` 是否有排队任务；GPU 可能忙碌 |
| 下载视频返回空 | 检查 `subfolder` 是否为 `video`（不是空字符串） |
| 首尾帧过渡不自然 | 检查首尾帧图片风格/构图是否一致，差异过大会导致中间帧质量下降 |
| 视频动态不足 | 正向提示词添加更多动作描述；增大 length 值增加帧数 |
| 401 鉴权失败 | 检查 Bearer Token 是否有效：`curl -H "Authorization: Bearer sk-xxx" $GW/api/v1/ai/queue` |
| 429 请求被限流 | AI 接口 10次/分/IP，稍后重试 |

## 所需模型文件

| 类型 | 文件名 | 存放目录 |
|------|--------|---------|
| Text Encoder | umt5_xxl_fp8_e4m3fn_scaled.safetensors | models/text_encoders/ |
| VAE | wan_2.1_vae.safetensors | models/vae/ |
| Diffusion (高噪声) | wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors | models/diffusion_models/ |
| Diffusion (低噪声) | wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors | models/diffusion_models/ |
| LoRA (高噪声加速) | wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors | models/loras/ |
| LoRA (低噪声加速) | wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors | models/loras/ |

## Verification Checklist

- [ ] 首帧图片上传成功，返回 `name` 值
- [ ] 尾帧图片上传成功，返回 `name` 值
- [ ] 工作流提交成功，`node_errors` 为空
- [ ] 任务在 `/api/v1/ai/queue` 中执行完成
- [ ] 任务状态 `completed: true`，outputs 包含节点 158 的 MP4 文件信息
- [ ] 成功下载 MP4 文件到 `get-output-dir.sh` 返回的输出目录（注意 `subfolder=video`）
- [ ] 视频可正常播放，首尾帧过渡自然
- [ ] 视频分辨率为 640×640，帧率 16fps
