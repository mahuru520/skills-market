---
name: comfyui-ltx2-text-to-video
description: "通过公网网关使用 ComfyUI LTX-2 19B 模型文生视频（带同步空音轨的 mp4）。当用户要求生成视频、文生视频、用文字描述生成动态画面、生成短视频时使用。"
metadata: { "openclaw": { "emoji": "🎬" } }
---

# ComfyUI LTX-2 文生视频

通过公网网关 `https://ai.ospreyai.cn` 调用 **LTX-2 19B** 模型，由英文提示词生成视频。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 最简：默认 5 秒 1280×720 视频到当前目录
python scripts/text_to_video.py --prompt "A cheerful girl puppet singing in the rain"

# 自定义时长/帧率/种子/输出名
python scripts/text_to_video.py \
  --prompt "A close-up of a cheerful girl puppet, singing with joy, rain falling around her" \
  --length 97 --fps 24 --seed 42 --output_prefix video/my_clip --output my_clip.mp4
```

## 模型文件

> 已在服务器上，无需下载。

| 类型 | 文件 |
|------|------|
| 主模型（Checkpoint） | `ltx-2-19b-dev-fp8.safetensors` |
| 文本/音频编码器 | `gemma_3_12B_it_fp4_mixed.safetensors` |
| 音频 VAE | `ltx-2-19b-dev-fp8.safetensors`（`LTXVAudioVAELoader`） |
| 空间放大器 | `ltx-2-spatial-upscaler-x2-1.0.safetensors` |
| 加速 LoRA | `ltx-2-19b-distilled-lora-384.safetensors`（strength=1） |

## 工作原理

LTX-2 采用**两阶段采样管线**，先用低分辨率快速打底，再空间放大精修：

1. **低清阶段**（640×360，20 步）：`EmptyImage(111)` 的宽高被脚本按 `--width/--height` 的 **一半** 取用（工作流内 `ImageScaleBy(104)` ×0.5），用 `LTXVScheduler(98)` 生成低清潜空间
2. **空间放大**：`LTXVLatentUpsampler(118)` 用 `ltx-2-spatial-upscaler-x2-1.0` 把潜空间 ×2 放大
3. **精修阶段**（1280×720，4 步）：用 `ManualSigmas(100)` 的固定 4 个 sigma 值做精修采样
4. **音视频分离/解码**：`LTXVSeparateAVLatent` → `VAEDecodeTiled`（视频）+ `LTXVAudioVAEDecode`（空音轨）→ `CreateVideo` 合成 mp4
5. **保存**：`SaveVideo(75)` 输出到 ComfyUI output 的 `video/` 子目录，格式 mp4

> 输出是**静音视频**（空音轨占位，非真实音频）。若需带真实音频，用 LTX 2.3 图音生视频工作流。

## 工作流节点图

```
EmptyImage(111, 1280×720)
   ↓ ImageScaleBy(104) ×0.5
   ↓ GetImageSize(105) → 640×360
EmptyLTXVLatentVideo(108, length=121)
LTXVEmptyLatentAudio(106, fps=24)
   ↓ LTXVConcatAVLatent(109) ─────────────────────┐
CheckpointLoader(138) → LoraLoader(132, distilled) ┤
                                                   ↓
LTXAVTextEncoderLoader(99) → CLIPTextEncode(121+) ─→ LTXVConditioning(107)
                          → CLIPTextEncode(110−)  ─→
                                                   ↓
LTXVScheduler(98) ──→ SamplerCustomAdvanced(113, 20步)  [低清]
RandomNoise(115, seed) ─────────────────────────────┘
   ↓ LTXVSeparateAVLatent(116) → LTXVConcatAVLatent(117)
   ↓ LTXVLatentUpsampler(118) ×2
ManualSigmas(100) ──→ SamplerCustomAdvanced(119, 4步)   [精修]
   ↓ LTXVSeparateAVLatent(124)
VAEDecodeTiled(126) ──→ CreateVideo(122, fps) ──→ SaveVideo(75, video/LTX-2)
LTXVAudioVAEDecode(127) ─┘
```

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--prompt` | 英文正向提示词（必须） | — |
| `--negative` | 负向提示词（可选，默认用工作流内置） | 内置模糊/低质/静态/水印等 |
| `--length` | 帧数 | 121 |
| `--fps` | 帧率（工作流两处 Primitive 节点会同步） | 24 |
| `--width` / `--height` | 输出分辨率 | 1280 × 720 |
| `--seed` | 随机种子（可选） | 工作流内置 |
| `--output_prefix` | 输出文件名前缀（可含子目录 `video/xxx`） | `video/LTX-2` |
| `--output` | 本地保存路径（可选，默认当前目录） | 服务端返回名 |
| `--timeout` | 轮询超时秒数 | 600 |

### Python 脚本

```bash
# 默认 5 秒视频
python scripts/text_to_video.py --prompt "A bird spreading its wings and flying away"

# 9 秒竖屏（需 width/height 能被 32 整除）
python scripts/text_to_video.py --prompt "..." --width 720 --height 1280 --length 217 --fps 24

# 指定种子复现
python scripts/text_to_video.py --prompt "..." --seed 42
```

### 脚本内部流程

`scripts/text_to_video.py` 做四件事：

1. 读取 `scripts/workflow.json`（完整 ComfyUI 工作流），按命令行参数替换正/负提示词、帧数、帧率、分辨率、种子、输出前缀
2. `POST /api/v1/ai/video/generate` 提交工作流，拿 `prompt_id`
3. 每 5 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
4. 从 `outputs` 里找 `gifs` 字段（SaveVideo 的视频），通过 `/api/v1/ai/image/view/` 下载 mp4

> 工作流 JSON 即原始导出文件，脚本只改值不改结构，方便后续对齐 ComfyUI 画布修改。

## 提示词技巧

- **英文优先**：文本编码器基于 Gemma-3，英文效果好
- **动作 + 镜头 + 光影 + 质感**四要素：
  ```
  A close-up of a cheerful girl puppet with curly auburn yarn hair,
  holding a small red umbrella. Rain falls gently around her.
  She looks upward and begins to sing with joy.
  The camera holds steady as the rain sparkles against the soft lighting.
  ```
- 描述具体动作（`singing`、`walking`、`turning`）比静态形容词更易出动态
- 想要运镜：加 `camera dolly out`、`slow pan`、`close-up` 等

## 参数调优

| 参数 | 含义 | 建议 |
|------|------|------|
| `--length` | 帧数，时长 ≈ length/fps | 121 帧≈5s；过长显存/时间剧增 |
| `--fps` | 帧率 | 24 标准；降 fps 可在相同 length 下延长时长 |
| `--width/--height` | 输出分辨率 | 需能被 32 整除；竖屏用 720×1280 |
| `--seed` | 随机种子 | 同 seed + 同 prompt 可复现 |
| 低清步数（节点 98 steps） | 20 步，工作流内固定 | 改高细节更多但更慢，需改 workflow.json |
| 精修步数（节点 100 sigmas） | 4 步，ManualSigmas 固定 | 一般不动 |

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 500 on generate | 工作流 JSON 格式错 | 确认用 `{"prompt": {...nodes...}, "extra_data": {}}` |
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| 504 / 轮询超时 | 视频生成慢或排队 | 首帧模型加载约 30s；增大 `--timeout`，或用返回的 `prompt_id` 手动重查 |
| `node_errors` 非空 | 节点参数/模型缺失 | 看 node_errors 详情；分辨率需被 32 整除 |
| outputs 无视频 | 任务失败或字段变了 | 打印 task 全量 JSON 排查；确认 `status.status_str=success` |
| 下载 404 | subfolder 没带 | 视频在 `video/` 子目录，下载 URL 的 `subfolder=video` 必须带上 |

## 限制

- 输出**静音视频**（空音轨占位），非真实音频
- 默认 1280×720 / 5 秒；大幅提高分辨率或时长会显著增加生成时间和显存占用
- 仅英文提示词效果最佳
- 两阶段采样，总耗时通常 1–3 分钟（视分辨率与排队）
