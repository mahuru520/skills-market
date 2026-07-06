---
name: vision-ocr
description: "使用视觉大模型（Vision LLM）对图片进行 OCR 文字提取、内容分析、表格识别、公式识别。图片通过外部视觉 API 识别，不占用主模型上下文窗口。支持自动压缩大图、自动获取 API Key。触发：OCR、识别图片、提取文字、图片内容、截图识别、表格提取、公式识别、图片转文字、扫描件识别、read image、extract text from image"
---

# Vision OCR - 视觉模型图片识别

使用视觉大模型对图片进行 OCR 文字提取、内容分析、表格识别。图片由外部 API 识别，主模型只接收纯文本结果，不浪费上下文窗口。

> ⚠️ **严禁用 Read 工具读取图片文件**（png/jpg/jpeg/gif/webp/bmp）。图片体积大，直接 Read 会撑爆上下文。一律通过本技能脚本调用外部视觉 API。

## 快速使用

```bash
# 最简用法（API Key 自动获取）
python3 <skill_dir>/scripts/vision_ocr.py "图片路径" auto

# 指定模型
python3 <skill_dir>/scripts/vision_ocr.py "图片路径" auto qwen3-vl-235b

# 指定模型和提示词
python3 <skill_dir>/scripts/vision_ocr.py "图片路径" auto qwen3-vl-30b "请将表格以 Markdown 格式提取"
```

`<skill_dir>` = `~/.openclaw/openclaw-workspace/skills/vision-ocr`

## API Key 自动获取

传入 `auto` 自动获取，按优先级：

1. 环境变量 `OSPREY_VISION_API_KEY`
2. 环境变量 `OSPREY_API_KEY`
3. 环境变量 `OPENAI_API_KEY`
4. OpenClaw 配置中 providers（按 `ospreyai` → `ospreyai_tokens` → `openai` 顺序查找）
5. 环境变量 `NEWAPI_BASE_URL` + 对应 Key 构建端点

> 通常直接传 `auto` 即可，脚本会自动从 OpenClaw 运行环境中获取。

## 可用视觉模型

| 模型 | 适用场景 |
|------|----------|
| `qwen3-vl-30b`（默认） | 通用 OCR、文字提取、表格识别、图文理解 |
| `qwen3-vl-235b` | 高精度 OCR、复杂表格/公式、多语言场景 |
| `GLM-4.7` | GLM 视觉模型（如平台支持） |

模型可用性取决于平台通道状态。如遇 `model_not_found`，切换其他模型。

## 参数

| 参数 | 位置 | 必填 | 说明 |
|------|------|------|------|
| `image_path` | argv[1] | ✅ | 图片文件路径 |
| `api_key` | argv[2] | ❌ | API 密钥，默认 `auto` |
| `model` | argv[3] | ❌ | 视觉模型，默认 `qwen3-vl-30b` |
| `prompt` | argv[4] | ❌ | 识别提示词，默认通用 OCR |

## 常用提示词

| 场景 | 提示词 |
|------|--------|
| 通用 OCR | `请详细识别并提取这张图片中的所有文本内容，保持原始格式和层级关系。如果是表格，请以表格形式呈现。` |
| 表格提取 | `请将图片中的表格以 Markdown 表格形式完整提取，保持所有行列数据。` |
| 公式识别 | `请识别图片中的数学公式，以 LaTeX 格式输出。` |
| 内容描述 | `请详细描述这张图片的内容，包括文字、图表、布局等所有信息。` |
| 多语言 | `请识别图片中的所有文字内容，包括中文、英文或其他语言，保持原文不变。` |
| 手写识别 | `请仔细识别图片中的手写文字内容，尽可能准确地转录。` |

## 工作流程

### 单张图片 OCR

1. 确认图片存在：`ls "图片路径"`（**不用 Read！**）
2. 执行识别：`python3 <skill_dir>/scripts/vision_ocr.py "图片路径" auto`
3. 展示识别结果给用户
4. 保存文件（可选）：用户要求时保存为 `.md` 或 `.txt`

### 批量图片识别

1. 收集图片：`find "目录" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \)`
2. 逐个执行脚本识别
3. 汇总到一个 Markdown 文件

### 互联网图片识别

1. 下载：`curl -sL -o /tmp/image.png "URL"`
2. 执行脚本识别
3. 清理临时文件

## 图片压缩

图片超过 500KB 时自动压缩（缩放 + 降质），无需手动处理。依赖 `Pillow`：

```bash
python3 -m pip install Pillow --break-system-packages
```

## 支持格式

PNG、JPEG、GIF、WebP、BMP

## 错误处理

| 错误 | 处理 |
|------|------|
| API 返回非 JSON | 检查网络，确认 API 端点可达 |
| HTTP 4xx/5xx | 脚本会打印详细错误信息；切换模型或检查 API Key |
| 识别结果不完整 | 切换更大模型（如 `qwen3-vl-235b`）或增加 `MAX_TOKENS` |
| 识别质量差 | 切换模型，或调整提示词使其更具体 |
| `No module named 'PIL'` | `python3 -m pip install Pillow --break-system-packages` |
| API Key 获取失败 | 设置环境变量 `OSPREY_VISION_API_KEY` 或手动传入 Key |
