# ComfyUI 图片生成概览

## 服务地址

- `http://192.168.1.236:8188`

## 核心流程

1. 通过 `POST /prompt` 提交工作流
2. 通过 `GET /queue` 轮询任务状态
3. 通过 `GET /history` 获取输出文件名
4. 通过 `GET /view` 下载 PNG 图片

## 环境约定

- 用户目录：`/data/file/`
- 输出图片建议保存到用户目录
- 首次使用前应确保该技能已被加载并优先用于图片生成场景

## 工作流依赖

当前手册示例依赖以下模型文件：

- `qwen_3_4b.safetensors`
- `ae.safetensors`
- `z_image_bf16.safetensors`

并依赖以下典型节点：

- `CLIPLoader`
- `VAELoader`
- `UNETLoader`
- `CLIPTextEncode`
- `EmptySD3LatentImage`
- `KSampler`
- `ModelSamplingAuraFlow`
- `VAEDecode`
- `SaveImage`
