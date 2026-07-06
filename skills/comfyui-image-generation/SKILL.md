---
name: comfyui-image-generation
description: 使用 ComfyUI API 生成图片。用于文生图、提交图片工作流、查询队列状态、获取历史输出并下载图片。
metadata:
  version: "1.0"
  category: image-generation
triggers:
  - 文生图
  - 图片生成
  - comfyui 生图
  - comfyui image
  - text-to-image
  - prompt
  - queue
  - history
  - view
---

# ComfyUI 图片生成

## Overview

用于通过 ComfyUI API 执行文生图工作流，覆盖工作流提交、队列查询、历史输出读取和图片下载。

## Quick Start

```bash
# 1. 提交图片生成任务（完整 workflow 见 references/workflow-submit.md）
curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'

# 2. 查看队列状态
curl -s "http://192.168.1.236:8188/queue"

# 3. 查看历史并下载图片
curl -s "http://192.168.1.236:8188/history"
curl -s "http://192.168.1.236:8188/view?filename=output_00001_.png" -o /data/file/output.png
```

## Task Routing

| 场景 | 动作 |
|------|------|
| 首次生成图片 | → Route A: Generate |
| 需要查看任务是否完成 | → Route B: Check Status |
| 需要获取或下载图片 | → Route C: Download |
| 需要调优提示词与参数 | → Route D: Tune Parameters |
| 需要排查服务、节点或模型问题 | → Route E: Troubleshoot |

## Route A: Generate

### 服务信息

- ComfyUI 地址：`http://192.168.1.236:8188`
- 提交接口：`POST /prompt`

### 完整工作流调用

```bash
curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "62": {"inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}, "class_type": "CLIPLoader"},
      "63": {"inputs": {"vae_name": "ae.safetensors"}, "class_type": "VAELoader"},
      "66": {"inputs": {"unet_name": "z_image_bf16.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
      "67": {"inputs": {"text": "你的描述", "clip": ["62", 0]}, "class_type": "CLIPTextEncode"},
      "68": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}, "class_type": "EmptySD3LatentImage"},
      "69": {"inputs": {"seed": 123456789, "steps": 30, "cfg": 4.5, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1, "model": ["70", 0], "positive": ["67", 0], "negative": ["71", 0], "latent_image": ["68", 0]}, "class_type": "KSampler"},
      "70": {"inputs": {"shift": 3, "model": ["66", 0]}, "class_type": "ModelSamplingAuraFlow"},
      "71": {"inputs": {"text": "blurry, low quality, distorted, deformed, ugly", "clip": ["62", 0]}, "class_type": "CLIPTextEncode"},
      "65": {"inputs": {"samples": ["69", 0], "vae": ["63", 0]}, "class_type": "VAEDecode"},
      "9": {"inputs": {"filename_prefix": "output", "images": ["65", 0]}, "class_type": "SaveImage"}
    }
  }'
```

### 节点说明

| 节点 ID | class_type | 功能 |
|---------|-----------|------|
| 62 | CLIPLoader | 加载 Lumina2 的 CLIP 模型 |
| 63 | VAELoader | 加载 VAE 解码器，将 latent 解码为像素图 |
| 66 | UNETLoader | 加载 UNet 去噪主模型 |
| 67 | CLIPTextEncode | 正向提示词编码 |
| 68 | EmptySD3LatentImage | 生成空 latent，设定宽高 |
| 69 | KSampler | 核心采样去噪，控制 seed/steps/cfg 等 |
| 70 | ModelSamplingAuraFlow | Lumina2 采样偏移调整 |
| 71 | CLIPTextEncode | 负向提示词编码 |
| 65 | VAEDecode | VAE 解码 latent → 像素图 |
| 9 | SaveImage | 保存图片，设置文件名前缀 |

### 关键参数

| 节点 | 字段 | 说明 | 示例值 |
|------|------|------|--------|
| 67 | text | 正向提示词（英文） | "A cute puppy" |
| 71 | text | 负向提示词 | "blurry, ugly" |
| 68 | width / height | 图片尺寸 | 1024 |
| 69 | seed | 随机种子（不同值生成不同图片） | 123456789 |
| 69 | steps | 采样步数（越高越精细） | 25-35 |
| 69 | cfg | CFG 强度（推荐 4-7） | 4.5 |
| 9 | filename_prefix | 输出文件名前缀 | "output" |

### 工作流最少需要包含

- 正向提示词节点
- 负向提示词节点
- 宽高配置
- seed
- steps
- cfg
- 保存图片节点与文件名前缀

See `references/workflow-submit.md` for details.

## Route B: Check Status

使用 `GET /queue` 查询任务状态，直到任务完成。

```bash
curl -s "http://192.168.1.236:8188/queue"
```

一般需要等待一小段时间，复杂工作流可能更久。

See `references/queue-history-download.md` for details.

## Route C: Download

先通过 `GET /history` 找到输出文件名，再通过 `GET /view?filename=...` 下载。

```bash
curl -s "http://192.168.1.236:8188/history"
curl -s "http://192.168.1.236:8188/view?filename=output_00001_.png" -o /data/file/output.png
```

- 默认输出格式：PNG
- 建议保存到用户目录：`/data/file/`

See `references/queue-history-download.md` for details.

## Route D: Tune Parameters

| 参数 | 建议 |
|------|------|
| prompt | 英文提示词效果更稳定 |
| negative prompt | 保持默认或追加不希望出现的元素 |
| width / height | 默认 1024 × 1024 |
| seed | 固定可复现，修改可生成不同变体 |
| steps | 推荐 25–35 |
| cfg | 推荐 4–7 |

See `references/parameters-prompts.md` for details.

## Route E: Troubleshoot

常见检查项：

- ComfyUI 服务是否可访问
- `/queue` 是否卡住
- `/history` 是否已有输出
- `/object_info` 是否能列出节点类型
- 工作流依赖模型是否存在

See `references/troubleshooting.md` for details.

## Verification Checklist

- [ ] `/prompt` 提交成功
- [ ] 任务在 `/queue` 中执行完成
- [ ] `/history` 可看到输出文件名
- [ ] `/view` 成功下载 PNG
- [ ] 图片尺寸与配置的宽高一致

## References

- `references/overview.md` — 能力概览与服务假设
- `references/workflow-submit.md` — 工作流提交示例
- `references/queue-history-download.md` — 队列、历史与下载
- `references/parameters-prompts.md` — 参数与提示词建议
- `references/examples.md` — 完整示例
- `references/troubleshooting.md` — 常见问题与排查
