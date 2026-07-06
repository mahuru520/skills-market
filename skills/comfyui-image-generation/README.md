# ComfyUI 图片生成

使用 ComfyUI API 进行文生图，并完成队列查询、历史读取和图片下载。

## Overview

本技能提供基于 ComfyUI 的图片生成能力，适合需要稳定提交 workflow、轮询状态并将图片保存到用户目录的场景。

## Quick Start

```bash
# 1. 提交 workflow
curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'

# 2. 查询队列
curl -s "http://192.168.1.236:8188/queue"

# 3. 下载输出图片
curl -s "http://192.168.1.236:8188/view?filename=output_00001_.png" -o /data/file/output.png
```

## Directory Structure

```
comfyui-image-generation/
├── SKILL.md
├── README.md
└── references/
    ├── overview.md
    ├── workflow-submit.md
    ├── queue-history-download.md
    ├── parameters-prompts.md
    ├── examples.md
    └── troubleshooting.md
```

## When to Use

- **comfyui-image-generation**：文生图、队列查询、图片下载
- **comfyui-video-generation**：图生视频或视频工作流

## Verification

- `/prompt` 提交成功
- `/queue` 显示任务完成
- `/history` 能获取输出文件名
- PNG 成功下载到 `/data/file/`

## References

- `references/overview.md`
- `references/workflow-submit.md`
- `references/queue-history-download.md`
- `references/parameters-prompts.md`
- `references/examples.md`
- `references/troubleshooting.md`
