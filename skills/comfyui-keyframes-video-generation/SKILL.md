---
name: comfyui-keyframes-video-generation
description: 通过公网网关使用 ComfyUI API 进行 6 关键帧首尾帧视频生成。覆盖 6 张图片上传、首尾帧工作流提交、队列/任务状态查询、MP4 视频下载的完整流程。
version: "1.0"
category: video-generation
triggers:
  - 关键帧视频
  - 首尾帧视频
  - 6张图片视频
  - 多关键帧
  - comfyui keyframes
  - WanFirstLastFrameToVideo
  - 帧间过渡
  - keyframe video
  - 首尾生成
---

# ComfyUI 6 关键帧首尾帧视频生成

## Overview

通过公网网关 `https://ai.ospreyai.cn` 使用 ComfyUI 将 **6 张关键帧图片** 生成一段连贯的过渡视频。

使用 **Wan 2.2 First-Last-Frame-to-Video (FLF2V)** 工作流，将 6 张关键帧拆分为 5 个首尾帧过渡段，每段生成 25 帧过渡动画，最终合并为一段完整视频（720×720, 24fps, ~5 秒）。

核心特性：
- **首尾帧控制**：每段视频精确从 start_image 过渡到 end_image
- **双 UNET 采样**：高噪声 + 低噪声模型分阶段采样，画质更稳定
- **LightX2V 4 步加速**：LoRA 加速仅需 4 步采样/段
- **5 段自动拼接**：6 张图 → 5 段过渡 → ImageBatch 合并 → 单视频输出

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## 基本流程

1. 上传 6 张关键帧图片到 ComfyUI（通过 `/api/v1/upload`）
2. 提交首尾帧视频工作流（通过 `/api/v1/ai/video/generate`）
3. 轮询任务状态（通过 `/api/v1/ai/tasks/{prompt_id}`）
4. 下载 MP4 视频（通过 `/api/v1/ai/image/view/`）

## 关键参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 尺寸 | 720×720 | 建议与原图一致 |
| 每段帧数 | 25 | 总视频 = 5段 × 25帧 = 125帧 |
| 帧率 | 24fps | 最终视频约 5.2 秒 |
| 采样步数 | 4 步/段 | LoRA 加速 |
| 输出前缀 | video/keyframes | 保存路径 |

## 工作流节点结构

每段包含：CLIPLoader + CLIPTextEncode(×2) + UNETLoader(×2) + LoraLoader(×2) + ModelSamplingSD3(×2) + WanFirstLastFrameToVideo + KSamplerAdvanced(×2) + VAEDecode + VAELoader

5 段合并用 ImageBatch(×4)，最终用 CreateVideo + SaveVideo 输出。

## 完整 Workflow JSON

详见 `scripts/generate_keyframes_video.py` 的 `build_workflow()` 函数，或直接运行脚本自动执行全流程（上传 → 提交 → 轮询 → 下载）。

## 参考

- 网关地址: `https://ai.ospreyai.cn`
- 上传接口: `POST /api/v1/upload`
- 提交接口: `POST /api/v1/ai/video/generate`
- 状态接口: `GET /api/v1/ai/tasks/{prompt_id}`
- 下载接口: `GET /api/v1/ai/image/view/?filename=xxx&subfolder=video&type=output`
