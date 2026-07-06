---
name: comfyui-video-generation
description: 使用 ComfyUI API 进行图生视频。用于上传输入图片、提交视频工作流、查询队列状态、获取历史输出并下载 mp4。
metadata:
  version: "1.0"
  category: video-generation
triggers:
  - 图生视频
  - 视频生成
  - comfyui 视频
  - comfyui video
  - image-to-video
  - upload image
  - mp4
  - queue
  - history
  - view
---

# ComfyUI 视频生成

## Overview

用于通过 ComfyUI API 将图片转换为视频，覆盖图片上传、工作流提交、队列查询、历史读取和 mp4 下载。

## Quick Start

```bash
# 1. 上传输入图片
curl -s -X POST "http://192.168.1.236:8188/upload/image" \
  -F "image=@/data/file/input.png" \
  -F "type=input"

# 2. 提交视频工作流（完整 workflow 见 references/upload-and-submit.md）
curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'

# 3. 查询队列并下载 mp4
curl -s "http://192.168.1.236:8188/queue"
curl -s "http://192.168.1.236:8188/view?filename=video/output.mp4&subfolder=video&type=output" -o /data/file/output.mp4
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次生成视频 | → Route A: Upload & Generate |
| 需要查看任务是否完成 | → Route B: Check Status |
| 需要获取或下载 mp4 | → Route C: Download |
| 需要调优提示词、帧数或尺寸 | → Route D: Tune Parameters |
| 需要排查服务、节点、模型或文件问题 | → Route E: Troubleshoot |

## Route A: Upload & Generate

### 服务信息

- ComfyUI 地址：`http://192.168.1.236:8188`
- 上传接口：`POST /upload/image`
- 提交接口：`POST /prompt`

### 基本流程

1. 先上传输入图片
2. 再提交图生视频工作流
3. 工作流中至少要包含：
   - `LoadImage`
   - `WanImageToVideo`
   - `CreateVideo`
   - `SaveVideo`

### 上传图片接口

```bash
curl -s -X POST "http://192.168.1.236:8188/upload/image" \
  -F "image=@/data/file/你的图片.png" \
  -F "type=input"
```

### 完整工作流调用

```bash
curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "84": {"inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}, "class_type": "CLIPLoader"},
      "85": {"inputs": {"add_noise": "disable", "noise_seed": 0, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "start_at_step": 2, "end_at_step": 4, "return_with_leftover_noise": "disable", "model": ["103", 0], "positive": ["98", 0], "negative": ["98", 1], "latent_image": ["86", 0]}, "class_type": "KSamplerAdvanced"},
      "86": {"inputs": {"add_noise": "enable", "noise_seed": 537400111571805, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "start_at_step": 0, "end_at_step": 2, "return_with_leftover_noise": "enable", "model": ["104", 0], "positive": ["98", 0], "negative": ["98", 1], "latent_image": ["98", 2]}, "class_type": "KSamplerAdvanced"},
      "87": {"inputs": {"samples": ["85", 0], "vae": ["90", 0]}, "class_type": "VAEDecode"},
      "89": {"inputs": {"text": "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸变的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走", "clip": ["84", 0]}, "class_type": "CLIPTextEncode"},
      "90": {"inputs": {"vae_name": "wan_2.1_vae.safetensors"}, "class_type": "VAELoader"},
      "93": {"inputs": {"text": "你的正向提示词（英文）", "clip": ["84", 0]}, "class_type": "CLIPTextEncode"},
      "94": {"inputs": {"fps": 16, "images": ["87", 0]}, "class_type": "CreateVideo"},
      "95": {"inputs": {"unet_name": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
      "96": {"inputs": {"unet_name": "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
      "97": {"inputs": {"image": "你的图片.png"}, "class_type": "LoadImage"},
      "98": {"inputs": {"width": 640, "height": 640, "length": 81, "batch_size": 1, "positive": ["93", 0], "negative": ["89", 0], "vae": ["90", 0], "start_image": ["97", 0]}, "class_type": "WanImageToVideo"},
      "101": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors", "strength_model": 1.0000000000000002, "model": ["95", 0]}, "class_type": "LoraLoaderModelOnly"},
      "102": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors", "strength_model": 1.0000000000000002, "model": ["96", 0]}, "class_type": "LoraLoaderModelOnly"},
      "103": {"inputs": {"shift": 5.000000000000001, "model": ["102", 0]}, "class_type": "ModelSamplingSD3"},
      "104": {"inputs": {"shift": 5.000000000000001, "model": ["101", 0]}, "class_type": "ModelSamplingSD3"},
      "108": {"inputs": {"filename_prefix": "video/你的视频名", "format": "auto", "codec": "auto", "video-preview": "", "video": ["94", 0]}, "class_type": "SaveVideo"}
    }
  }'
```

### 节点说明

| 节点 ID | class_type | 功能 |
|---------|-----------|------|
| 84 | CLIPLoader | 加载 Wan 的 CLIP 模型 |
| 85 | KSamplerAdvanced | 后半段采样（去噪，步骤 2→4） |
| 86 | KSamplerAdvanced | 前半段采样（加噪，步骤 0→2） |
| 87 | VAEDecode | VAE 解码 latent → 像素帧 |
| 89 | CLIPTextEncode | 负向提示词编码 |
| 90 | VAELoader | 加载 VAE |
| 93 | CLIPTextEncode | 正向提示词编码 |
| 94 | CreateVideo | 创建视频，设置帧率 |
| 95 | UNETLoader | 加载高噪声 UNet |
| 96 | UNETLoader | 加载低噪声 UNet |
| 97 | LoadImage | 加载已上传的输入图片 |
| 98 | WanImageToVideo | 图像转视频核心节点 |
| 101 | LoraLoaderModelOnly | 加载高噪声 LoRA（4步加速） |
| 102 | LoraLoaderModelOnly | 加载低噪声 LoRA（4步加速） |
| 103 | ModelSamplingSD3 | 低噪声模型采样偏移调整 |
| 104 | ModelSamplingSD3 | 高噪声模型采样偏移调整 |
| 108 | SaveVideo | 保存视频 |

### 关键参数

| 节点 | 字段 | 说明 | 示例值 |
|------|------|------|--------|
| 97 | image | 输入图片文件名（需先上传） | "input.png" |
| 93 | text | 正向提示词（英文动作描述） | "A bird flying in the sky" |
| 98 | width / height | 视频尺寸 | 640 |
| 98 | length | 视频帧数（81帧≈5秒@16fps） | 81 |
| 94 | fps | 帧率 | 16 |
| 108 | filename_prefix | 输出文件名前缀 | "video/my_video" |

### 输出视频参数

- **分辨率**: 640×640
- **帧数**: 81 帧
- **帧率**: 16 fps
- **时长**: 约 5 秒
- **格式**: MP4

See `references/upload-and-submit.md` for details.

## Route B: Check Status

使用 `GET /queue` 检查任务状态。

```bash
curl -s "http://192.168.1.236:8188/queue"
```

视频生成通常需要 1–2 分钟。

See `references/queue-history-download.md` for details.

## Route C: Download

下载前建议先确认实际输出文件名，再通过 `GET /view` 下载视频。

```bash
curl -s "http://192.168.1.236:8188/history"
curl -s "http://192.168.1.236:8188/view?filename=video/output.mp4&subfolder=video&type=output" -o /data/file/output.mp4
```

- 输出格式：MP4
- 建议下载到 `/data/file/`
- 中文文件名场景建议使用 Python 方式处理 URL 编码

See `references/queue-history-download.md` for details.

## Route D: Tune Parameters

| 参数 | 建议 |
|------|------|
| 输入图片 | 推荐 PNG |
| 正向提示词 | 英文动作描述更稳定 |
| width / height | 默认 640 × 640 |
| length | 默认 81 帧 |
| fps | 默认 16 |
| negative prompt | 默认可保持手册值 |

See `references/parameters-prompts.md` for details.

## Route E: Troubleshoot

常见检查项：

- 输入图片是否先上传
- `/queue` 是否长时间未完成
- `/history` 是否已有输出
- 下载时文件名、子目录是否匹配
- 工作流依赖模型和节点是否齐全

See `references/troubleshooting.md` for details.

## Verification Checklist

- [ ] 输入图片上传成功
- [ ] `/prompt` 提交成功
- [ ] 任务在 `/queue` 中执行完成
- [ ] 成功下载 mp4 文件
- [ ] 视频可正常播放且分辨率符合配置

## References

- `references/overview.md` — 能力概览与服务假设
- `references/upload-and-submit.md` — 上传与工作流提交
- `references/queue-history-download.md` — 队列、历史与下载
- `references/parameters-prompts.md` — 参数与提示词建议
- `references/examples.md` — 完整示例
- `references/troubleshooting.md` — 常见问题与排查
