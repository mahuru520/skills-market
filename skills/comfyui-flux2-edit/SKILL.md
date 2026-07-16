---
name: comfyui-flux2-edit
description: "通过公网网关使用 ComfyUI FLUX.2-klein-9b-kv 图生图/局部编辑，上传图片+写 prompt 即可生成，支持换装、换背景、局部修改。"
---

# ComfyUI FLUX.2-klein 图生图编辑

通过公网网关 `https://ai.ospreyai.cn` 的 FLUX.2-klein-9b-kv-fp8 模型做图片编辑。通过 Reference Conditioning 技术，把参考图片的服装/形象迁移到目标人物，同时可改背景。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 1. 上传图片
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@<本地图片路径>" -F "type=input"

# 2. 修改并运行脚本
python scripts/submit_and_poll.py \
  --img1 <图1文件名> \
  --img2 <图2文件名> \
  --prompt "<英文提示词>" \
  --output_prefix <输出前缀>

# 3. 下载结果
curl -s -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=<output_prefix>_00001_.png&type=output&subfolder=" \
  -o result.png
```

## 环境

- 网关地址：`https://ai.ospreyai.cn`（变量 `$GW`）
- 鉴权：`Authorization: Bearer $API_KEY`（网关 new-api 的 `sk-xxx`）
- 模型：`flux-2-klein-9b-kv-fp8.safetensors` + `qwen_3_8b_fp8mixed.safetensors` + `flux2-vae.safetensors`
- 自动加载，无需手动准备

## 工作流程

### 1. 上传图片

```bash
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@<本地图片路径>" -F "type=input"
```

返回 `{ "name": "...", "subfolder": "" }` 即成功。

### 2. 修改并运行脚本

直接调用 `scripts/submit_and_poll.py`：

```bash
python scripts/submit_and_poll.py \
  --img1 <图1文件名> \
  --img2 <图2文件名> \
  --prompt "<英文提示词>" \
  --output_prefix <输出前缀>
```

**示例**：
```bash
# 换装（需要两张图）
python scripts/submit_and_poll.py \
  --img1 man_street.png \
  --img2 safari_outfit.png \
  --prompt "Have the man put on the clothes from Figure 2, keep same posture" \
  --output_prefix Result

# 局部修改（单图自我参考）
python scripts/submit_and_poll.py \
  --img1 Result_00001_.png \
  --img2 Result_00001_.png \
  --prompt "Remove the outer jacket, keep inner clothing only" \
  --output_prefix NoJacket
```

### 3. 下载结果

```bash
curl -s -H "Authorization: Bearer $API_KEY" \
  "$GW/api/v1/ai/image/view/?filename=<output_prefix>_00001_.png&type=output&subfolder=" \
  -o result.png
```

## 提示词技巧

- Reference Conditioning 节点用 Figure 1/Figure 2 指代图1/图2
- 换装：`"Have the man in Figure 1 put on the clothes from Figure 2, keep same posture"`
- 改背景：`"Change background to African savannah, keep person unchanged"`
- 去掉元素：`"Remove the outer jacket, keep the person and background unchanged"`
- 保持风格统一时，图1图2设为同一张可实现局部微调

## 技术细节

- 4 步生成，速度极快（<1 秒）
- 使用 `FluxKVCache` 加速，`Flux2Scheduler` 控制步数
- Reference Conditioning 依赖两个子图（`ReferenceLatent` + `VAEEncode`）
- API 节点 ID 用下划线格式：`134_116`、`134_117`、`134_118`、`132_119`、`132_120`、`132_121`

## 注意事项

- 提示词用英文，模型基于 Qwen3-8B CLIP，对中文支持有限
- 图片上传到 ComfyUI input 目录（`-F "type=input"`）
- 若 `node_errors` 非空，检查图片是否上传成功
- ComfyUI prompt API 需要 nodes dict 而非数组
