# ComfyUI Wan 2.2 Fun Inpaint 首尾帧视频生成

通过公网网关 `https://ai.ospreyai.cn` 使用 ComfyUI 将 **首帧 + 尾帧两张图片** 生成一段过渡视频，覆盖图片上传、工作流提交、状态查询和 MP4 下载。

## Overview

本技能提供基于 ComfyUI 的首尾帧补间能力，通过外网网关鉴权调用。核心节点 `WanFunInpaintToVideo` 接收首帧和尾帧，自动补间生成两帧之间的平滑过渡动画（640×640, 16fps, 81帧, ~5 秒）。适合需要"从画面 A 精确过渡到画面 B"的场景。

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

# 2. 提交 Fun Inpaint 视频 workflow（完整 JSON 见 SKILL.md Route A）
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/ai/video/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'

# 3. 下载输出 mp4
curl -s -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=output.mp4&subfolder=video&type=output" \
  -o "$OUT/output.mp4"
```

## Directory Structure

```
comfyui-fun-inpaint-video-generation/
├── SKILL.md
├── README.md
└── scripts/
    └── generate_fun_inpaint_video.py
```

## When to Use

- **comfyui-video-generation**：单张图生视频
- **comfyui-keyframes-video-generation**：6 张关键帧串联视频
- **comfyui-fun-inpaint-video-generation**（本技能）：两张图（首+尾）之间的精确过渡

## Verification

- `/api/v1/upload` 首帧、尾帧上传成功，返回各自的 `name` 值
- `/api/v1/ai/video/generate` 提交成功，`node_errors` 为空
- `/api/v1/ai/tasks/{prompt_id}` 状态 `completed: true`，outputs 含节点 158 的 MP4 文件信息
- MP4 成功下载到 `get-output-dir.sh` 返回的输出目录（注意 `subfolder=video`）
