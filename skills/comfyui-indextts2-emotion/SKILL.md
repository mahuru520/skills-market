---
name: comfyui-indextts2-emotion
description: "通过公网网关使用 IndexTTS2 做音色克隆语音合成并控制情绪。用一段参考音频克隆音色，把文本念出来，可指定 8 种情绪（开心/生气/悲伤等）及强度。当用户要求语音合成、文字转语音、TTS、克隆声音、带情绪说话时使用。"
metadata: { "openclaw": { "emoji": "🎙️" } }
---

# ComfyUI IndexTTS2 情绪控制语音合成

通过公网网关 `https://ai.ospreyai.cn` 调用 **IndexTTS2**，用一段参考音频克隆音色、把文本合成语音，并可对情绪进行细粒度控制。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 1. 上传参考音频（确定音色）
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@ref_voice.wav" -F "type=input"
# 返回 {"name": "ref_voice.wav", ...}，记住文件名

# 2. 用参考音色合成"开心"情绪的语音
python scripts/tts_emotion.py \
  --prompt "今天天气真好，我们去爬山吧！" \
  --ref ref_voice.wav \
  --emotion happy --intensity 1.5
```

## 工作原理

IndexTTS2 是**音色克隆型 TTS**：用一段参考音频（任意人声）确定音色，再把输入文本用该音色念出来。情绪控制通过 `Emotional Control` 节点提供一个 8 维情绪向量，作用于合成结果。

- **8 种情绪**：`happy` / `angry` / `sad` / `fear` / `hate` / `low`（低落）/ `surprise` / `neutral`（中性）
- **强度**：-2 ~ 2，正值加强该情绪，负值反向，0 不作用
- 一次只设一种情绪（其余置 0）

## 工作流节点图

```
LoadAudio(14, 参考音频) ──┐
MultiLinePromptIndex(13, 文本) ──┐
Emotional Control(16, 情绪向量) ──┤
                                 ↓
                          IndexTTS2Run(11) ──→ SaveAudioMP3(20, IN会话)
```

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--prompt` | 要合成的文本（中/英文均可，必须） | — |
| `--ref` | 参考音频文件名（需先上传，必须） | — |
| `--emotion` | 情绪：happy/angry/sad/fear/hate/low/surprise/neutral | neutral |
| `--intensity` | 情绪强度 -2~2 | 1.0 |
| `--output_prefix` | 输出文件名前缀 | IN会话 |
| `--output` | 本地保存路径 | 当前目录/服务端名 |
| `--timeout` | 轮询超时秒数 | 300 |

### Python 脚本

```bash
# 开心（强）
python scripts/tts_emotion.py --prompt "太棒了！我们赢了！" --ref ref.wav --emotion happy --intensity 2

# 悲伤
python scripts/tts_emotion.py --prompt "他走了，再也没回来。" --ref ref.wav --emotion sad --intensity 1.5

# 中性（不带情绪）
python scripts/tts_emotion.py --prompt "现在是新闻播报时间。" --ref ref.wav

# 指定输出名
python scripts/tts_emotion.py --prompt "..." --ref ref.wav --output out.mp3
```

### 脚本内部流程

1. 读取 `scripts/workflow.json`，替换文本、参考音频文件名、情绪向量、输出前缀
2. `POST /api/v1/ai/audio/generate` 提交工作流，拿 `prompt_id`
3. 每 4 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
4. 从 `outputs[].audio` 取 mp3，通过 `/api/v1/ai/image/view/` 下载

## 情绪参数速查

| 情绪 | 字段 | 典型场景 |
|------|------|----------|
| happy | happy | 开心、兴奋 |
| angry | angry | 生气、愤怒 |
| sad | sad | 悲伤、难过 |
| fear | fear | 害怕、恐惧 |
| hate | hate | 厌恶 |
| low | low | 低落、消沉 |
| surprise | surprise | 惊讶 |
| neutral | neutral | 中性、播报 |

> 强度建议 0.5~2.0；过大可能失真。负值产生反向效果（如 happy=-1 偏低落）。

## 输出

- 格式：MP3
- 位置：ComfyUI output 根目录（`subfolder` 为空）
- 下载：`GET /api/v1/ai/image/view/?filename=xxx.mp3&type=output&subfolder=`

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` 环境变量 |
| `node_errors` 非空 | 参考音频未上传/文件名错 | 先 `POST /api/v1/upload` 上传，文件名与 `--ref` 一致 |
| 任务 success 但 outputs 空 | 命中 ComfyUI 缓存 | 改文本或参考音频，避免与历史完全相同 |
| 轮询超时 | 模型加载/排队 | 首次加载较慢；增大 `--timeout`，用 prompt_id 手动重查 |
| 下载 404 | type/subfolder 错 | IndexTTS2 输出 `type=output`、`subfolder=""`（空） |

## 限制

- 参考音频质量决定克隆效果，建议清晰人声、5~15 秒
- 文本过长会显著增加合成时间
- 情绪强度过大可能产生失真
