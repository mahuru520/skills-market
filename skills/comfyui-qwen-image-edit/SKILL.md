---
name: comfyui-qwen-image-edit
description: "通过公网网关使用 Qwen-Image-Edit-2511 模型编辑图片（换装、改背景、物体替换等）。当用户要求编辑图片、改图、换衣服、改背景、P掉物体、给图片加元素时使用。"
metadata: { "openclaw": { "emoji": "🖼️" } }
---

# ComfyUI Qwen-Image-Edit 图片编辑

通过公网网关 `https://ai.ospreyai.cn` 调用 **Qwen-Image-Edit-2511** 模型做高质量图片编辑。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 自我编辑（去掉外套）
python scripts/img_edit.py "Remove the jacket, keep the T-shirt" input.png

# 换装（两张图）
python scripts/img_edit.py "Person A wears the clothes from image 2" target.png ref.png

# 指定输出文件名
python scripts/img_edit.py "Add a red scarf" input.png output.png
```

## 模型文件

> 已在服务器上，无需下载。

| 类型 | 文件 |
|------|------|
| UNet | `qwen_image_edit_2511_bf16.safetensors` |
| CLIP | `qwen_2.5_vl_7b_fp8_scaled.safetensors` |
| VAE | `qwen_image_vae.safetensors` |
| LoRA (4步) | `Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors` |

## 工作原理

Qwen-Image-Edit-2511 基于 Qwen-VL 视觉语言模型，支持**参照编辑**：

- **自我编辑**（单图）：同一张图作为输入和参考，提示词描述想要的变化
- **换装/换物**（双图）：image1 = 目标人物，image2 = 参照服装/物品
- **三图参考**：image1/2/3 组合提供多种参考

**推荐提示词策略：**
- 换装：`"Have the person in image 1 wear the clothes from image 2"`
- 改背景：`"Change the background of image 1 to a sunny beach"`
- 去除物体：`"Remove the jacket, keep the T-shirt underneath"`
- 物体替换：`"Replace the red wine with flowers"`

## 使用方法

### Python 脚本

```bash
# 自我编辑（去掉外套）
python scripts/img_edit.py "Remove the jacket, keep the T-shirt" input.png

# 换装（两张图）
python scripts/img_edit.py "Person A wears the clothes from image 2" target.png ref.png

# 指定输出文件名
python scripts/img_edit.py "Add a red scarf" input.png output.png

# 非 Turbo 模式（40步，质量更高但更慢）
# 修改脚本中 turbo=True → turbo=False
```

### 参数

| 参数 | 说明 |
|------|------|
| prompt | 英文编辑提示词（必须） |
| input_path | 输入图片路径（必须） |
| ref_path | 参考图片路径（可选，默认同 input = 自我编辑） |
| output_name | 输出文件名（可选，默认自动生成） |

### API 格式关键发现

- ComfyUI v0.20.1 使用 **v1 dict 格式**：`{"prompt": {...nodes...}, "extra_data": {}}`
- 节点连接用 **`["node_id", slot_index]` 格式**，如 `["41", 0]`
- 工作流使用子图节点前缀 `170:` 避免与顶层节点 ID 冲突

## 工作流节点图

```
LoadImage(41) ──→ FluxKontextImageScale(170:160) ──→ VAEEncode(170:156) ──┐
LoadImage(83) ────────────────────────────────────────────────────────┘  │
       ↓                                                                      ↓
UNETLoader(170:161) → ModelSamplingAuraFlow(170:145) → CFGNorm(170:152) ─→ LoraLoader(170:153)
                                                                                   ↓
CLIPLoader(170:162) ──→ TextEncodeQwenImageEditPlus(170:151) ──→ FluxKontextMultiRef(170:148) ──┐
       ↓                                                                                             ↓
CLIPLoader(170:162) ──→ TextEncodeQwenImageEditPlus(170:149) ──→ FluxKontextMultiRef(170:147) ──┘
                                                                                                 ↓
                                                                                        KSampler(170:169)
                                                                                                 ↓
                                                                                       VAEDecode(170:158)
                                                                                                 ↓
                                                                                       SaveImage(9)
```

## Turbo vs Native

| 模式 | 步数 | CFG | 速度 (RTX 5090) | 质量 |
|------|------|-----|-----------------|------|
| Turbo (Lightning LoRA) | 4 | 1.0 | ~2-6s | 好 |
| Native | 40 | 4.0 | ~15-20s | 更好 |

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 500 on generate | API 格式错误 | 确认用 v1 dict 格式，不是数组格式 |
| Bad linked input | 连接格式不对 | 用 `["41", 0]` 而非 `{"41": "IMAGE"}` |
| 504 timeout | 模型加载慢 | 首次运行需加载 Qwen-VL（约30s），后续快 |
| 401 | Token 无效 | 检查 `API_KEY` 环境变量是否正确 |

## 限制

- 仅支持英文提示词（Qwen-VL 对中文支持有限）
- 图片尺寸超过 2048×2048 可能需要调整 VAE 缩放节点
- Turbo 模式（4步）有质量上限，复杂编辑建议用 Native 模式
