---
name: comfyui-qwen-tts
description: "通过公网网关使用 Qwen3-TTS 做语音定制。支持两种模式：VoiceDesign 用文字描述直接生成自定义音色并朗读；VoiceClone 用参考音频克隆音色朗读新文本。当用户要求文字转语音、定制音色、声音设计、克隆声音、Qwen TTS 时使用。"
metadata: { "openclaw": { "emoji": "🔊" } }
---

# ComfyUI Qwen3-TTS 语音定制

通过公网网关 `https://ai.ospreyai.cn` 调用 **通义千问 Qwen3-TTS（1.7B）**，支持两种语音定制模式。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# VoiceDesign：用文字描述音色，直接朗读文本（无需参考音频）
python scripts/tts_qwen.py --mode design \
  --text "今晚，和一个危险又迷人的姐姐喝了一杯。" \
  --instruct "模拟成熟性感的御姐音色，声音略带磁性且慵懒。"

# VoiceClone：用参考音频克隆音色，朗读新文本
# 先上传参考音频
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@ref.wav" -F "type=input"
python scripts/tts_qwen.py --mode clone \
  --text "紧张什么？你连坐姿都在发抖……" \
  --ref ref.wav --ref_text "这是参考音频里说的那句话。"
```

## 两种模式

### VoiceDesign（音色设计）

纯文字描述即可生成全新音色并朗读，**无需参考音频**。

- `--text`：要朗读的文本
- `--instruct`：音色描述（如"成熟性感的御姐音色，磁性且慵懒"）
- 适合：想要某个不存在的人声、按描述定制音色

### VoiceClone（音色克隆）

提供参考音频 + 参考文字，克隆该音色朗读新文本。

- `--text`：要用克隆音色朗读的目标文本
- `--ref`：参考音频文件名（需先上传）
- `--ref_text`：参考音频里说的那句话文字（用于对齐音色）
- 适合：模仿某个具体人的声音

> 两者区别：VoiceDesign 凭描述"造"音色，VoiceClone 凭样本"仿"音色。

## 工作流节点图

```
[VoiceDesign 模式]                [VoiceClone 模式]
String(6, 文本) ──┐               String(6, ref_text) ──┐
                   ↓                                     ↓
          Qwen3TTSVoiceDesign(1) ──→ PreviewAudio(2)   Qwen3TTSVoiceClone(5) ──→ PreviewAudio(7)
                                                      ↑
                                          LoadAudio(100, ref)  ← 脚本运行时注入
```

> 原工作流 VoiceClone 的 `ref_audio` 连接的是 VoiceDesign 节点输出（界面交互用）。
> 脚本在 clone 模式下会注入一个 `LoadAudio` 节点接已上传的参考音频，替换该连接。

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--mode` | `design` 或 `clone`（必须） | — |
| `--text` | design: 朗读文本；clone: 目标文本（必须） | — |
| `--instruct` | [design] 音色描述 | — |
| `--ref` | [clone] 参考音频文件名 | — |
| `--ref_text` | [clone] 参考音频对应文字 | — |
| `--language` | 语言 | Auto |
| `--seed` | 随机种子 | 时间戳随机 |
| `--output` | 本地保存路径 | 当前目录，扩展名取服务端 |
| `--timeout` | 轮询超时秒数 | 300 |

### Python 脚本

```bash
# VoiceDesign：御姐音
python scripts/tts_qwen.py --mode design \
  --text "别急，慢慢来，我有的是时间。" \
  --instruct "成熟女性，声音低沉磁性，语速舒缓，带一丝慵懒。"

# VoiceDesign：少年音
python scripts/tts_qwen.py --mode design \
  --text "冲啊！今天一定要拿下冠军！" \
  --instruct "热血少年音，明亮清脆，语速偏快，充满活力。"

# VoiceClone：克隆参考音色朗读新内容
python scripts/tts_qwen.py --mode clone \
  --text "现在是明天下午三点的天气预报。" \
  --ref anchor.wav --ref_text "大家好，欢迎收看新闻。"
```

### 脚本内部流程

1. 读取 `scripts/workflow.json`
2. 按 `--mode` 选取对应链路节点：
   - design：保留节点 1（VoiceDesign）、2（PreviewAudio）、6（String），替换文本/指令/seed
   - clone：保留节点 5（VoiceClone）、7（PreviewAudio）、6（String），注入节点 100（LoadAudio）接参考音频，替换目标文本/ref_text/seed
3. `POST /api/v1/ai/audio/generate` 提交，拿 `prompt_id`
4. 每 4 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
5. 从 `outputs[].audio` 取音频下载

## 输出

- 格式：**FLAC**（工作流原导出用 `PreviewAudio` 节点，输出 flac）
- 位置：ComfyUI **temp 目录**（`type=temp`，`subfolder` 为空）
- 文件名：带随机串，如 `ComfyUI_temp_xxx_00001.flac`
- 下载：`GET /api/v1/ai/image/view/?filename=xxx.flac&type=temp&subfolder=`

> temp 是临时目录，ComfyUI 会定期清理。需长期保存请及时下载。

## instruct 音色描述技巧

描述越具体，音色越贴近预期，建议覆盖：

- **音色类型**：御姐 / 少年 / 萝莉 / 大叔 / 老者
- **声音质感**：磁性 / 清脆 / 沙哑 / 温润 / 低沉
- **语速**：舒缓 / 适中 / 偏快
- **语调/情绪**：慵懒 / 自信 / 热情 / 冷淡
- **特殊**：尾音拖长 / 上扬 / 颤音

示例：
```
模拟成熟性感的御姐音色，声音略带磁性且慵懒，语速不快不慢，
语调充满自信和一丝挑逗，尾音可以稍微拖长并上扬。
```

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` |
| `node_errors` 非空 | clone 模式参考音频未上传/文件名错 | 先 `POST /api/v1/upload` 上传，文件名与 `--ref` 一致 |
| 任务 success 但 outputs 空 | 命中 ComfyUI 缓存 | 改 seed 或文本，脚本默认已随机 seed |
| 下载 404 | type 错 | Qwen-TTS 输出在 **temp 目录**，下载 URL 必须用 `type=temp` |
| clone 模式报 ref_audio 错 | ref_text 与参考音频不匹配 | ref_text 应是参考音频里真实说的话 |

## 限制

- VoiceDesign 的音色质量取决于 instruct 描述的准确度
- VoiceClone 需提供与参考音频**内容一致**的 ref_text，否则克隆效果下降
- 输出在 temp 目录（临时文件），需及时下载
- 文本过长会显著增加生成时间
