# ComfyUI 视频生成

使用 ComfyUI API 将图片转换为视频，并完成队列查询、历史读取和 mp4 下载。

## Overview

本技能提供基于 ComfyUI 的图生视频能力，适合需要稳定上传输入图、执行视频工作流并将结果保存到用户目录的场景。

## Quick Start

```bash
# 1. 上传输入图片
curl -s -X POST "http://192.168.1.236:8188/upload/image" \
  -F "image=@/data/file/input.png" \
  -F "type=input"

# 2. 提交视频 workflow
curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'

# 3. 下载输出 mp4
curl -s "http://192.168.1.236:8188/view?filename=video/output.mp4&subfolder=video&type=output" -o /data/file/output.mp4
```

## Directory Structure

```
comfyui-video-generation/
├── SKILL.md
├── README.md
└── references/
    ├── overview.md
    ├── upload-and-submit.md
    ├── queue-history-download.md
    ├── parameters-prompts.md
    ├── examples.md
    └── troubleshooting.md
```

## When to Use

- **comfyui-video-generation**：图生视频、队列查询、视频下载
- **comfyui-image-generation**：文生图和静态图片生成

## Verification

- 输入图片上传成功
- `/prompt` 提交成功
- `/queue` 显示任务完成
- MP4 成功下载到 `/data/file/`

## References

- `references/overview.md`
- `references/upload-and-submit.md`
- `references/queue-history-download.md`
- `references/parameters-prompts.md`
- `references/examples.md`
- `references/troubleshooting.md`
