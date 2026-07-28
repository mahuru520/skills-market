---
name: comfyui-indextts2-dialogue
description: "通过公网网关使用 IndexTTS2 做双人会话语音合成。用两段参考音频分别克隆 S1/S2 音色，按对话脚本交替合成两人的对话音频。当用户要求双人对话配音、两个角色对话、交替说话合成时使用。"
metadata: { "openclaw": { "emoji": "🗣️" } }
---

# ComfyUI IndexTTS2 双人会话语音合成

通过公网网关 `https://ai.ospreyai.cn` 调用 **IndexTTS2**，用两段不同的参考音频分别克隆两个说话人（S1/S2）的音色，按对话脚本交替合成一段完整的对话音频。

所有 API 均需 Bearer Token 鉴权（`Authorization: Bearer sk-xxx`）。

## Quick Start

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-your-api-key"

# 1. 上传两个说话人的参考音频
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@speaker1.wav" -F "type=input"
curl -s -H "Authorization: Bearer $API_KEY" -X POST "$GW/api/v1/upload" \
  -F "image=@speaker2.wav" -F "type=input"

# 2. 合成双人对话
python scripts/tts_dialogue.py \
  --script "[S1] 你好呀，今天过得怎么样？
[S2] 还不错，刚忙完手头的事。
[S1] 晚上一起吃饭吧。" \
  --ref1 speaker1.wav --ref2 speaker2.wav
```

## 工作原理

- 用 **两段不同的参考音频** 分别克隆 S1、S2 的音色
- 对话脚本由 `MultiLinePromptIndex` 节点提供，每行以 `[S1]` 或 `[S2]` 开头标注说话人
- IndexTTS2 的 `IndexTTS2Run` 节点支持双说话人：`audio` 接 S1 参考、`dialogue_audio_s2` 接 S2 参考
- 可为 S1、S2 分别设情绪（各 8 种，-2~2），由两个 `Emotional Control` 节点提供
- 输出**单个 mp3**，包含两人交替的对话

## 工作流节点图

```
LoadAudio(46, S1参考) ──────────────────────────┐
LoadAudio(55, S2参考) ────────────────────────┐ │
MultiLinePromptIndex(11, [S1]/[S2] 脚本) ──┐  │ │
Emotional Control(60, S1情绪) ──────────┐  │  │ │
Emotional Control(61, S2情绪) ────────┐ │  │  │ │
                                      ↓ ↓  ↓ ↓
                            IndexTTS2Run(58) ──→ SaveAudioMP3(57, IN会话)
```

## 使用方法

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--script` | 对话脚本，每行以 `[S1]`/`[S2]` 开头（必须） | — |
| `--ref1` | S1 参考音频文件名（需先上传，必须） | — |
| `--ref2` | S2 参考音频文件名（需先上传，必须） | — |
| `--emo1` / `--int1` | S1 情绪 / 强度 | neutral / 1.0 |
| `--emo2` / `--int2` | S2 情绪 / 强度 | neutral / 1.0 |
| `--output_prefix` | 输出文件名前缀 | IN会话 |
| `--output` | 本地保存路径 | 当前目录/服务端名 |
| `--timeout` | 轮询超时秒数 | 300 |

### Python 脚本

```bash
# 基础双人对话
python scripts/tts_dialogue.py \
  --script "[S1] 你好呀，今天过得怎么样？
[S2] 还不错，刚忙完手头的事。" \
  --ref1 speaker1.wav --ref2 speaker2.wav

# 带情绪：S1 开心、S2 悲伤
python scripts/tts_dialogue.py \
  --script "[S1] 我们中彩票了！
[S2] 可是我丢了钱包……" \
  --ref1 speaker1.wav --ref2 speaker2.wav \
  --emo1 happy --int1 1.8 --emo2 sad --int2 1.5
```

### 脚本格式

对话脚本每行一条，以 `[S1]` 或 `[S2]` 开头，可交替：

```
[S1] 第一句（S1 说）
[S2] 第二句（S2 说）
[S1] 第三句（S1 说）
```

> S1/S2 顺序与出现次数不限，脚本里谁先出现谁先开口。

### 脚本内部流程

1. 读取 `scripts/workflow.json`，替换脚本、两个参考音频文件名、两套情绪向量、输出前缀
2. `POST /api/v1/ai/image/generate` 提交，拿 `prompt_id`
3. 每 4 秒轮询 `GET /api/v1/ai/tasks/{prompt_id}` 直到 `completed=true`
4. 从 `outputs[].audio` 取 mp3 下载

## 输出

- 格式：MP3（单文件，含两人对话）
- 位置：ComfyUI output 根目录（`subfolder` 为空）
- 下载：`GET /api/v1/ai/image/view/?filename=xxx.mp3&type=output&subfolder=`

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` |
| `node_errors` 非空 | 参考音频未上传/文件名错 | 两个参考音频都要先上传，文件名与 `--ref1`/`--ref2` 一致 |
| 任务 success 但 outputs 空 | 命中 ComfyUI 缓存 | 改脚本内容或参考音频，避免与历史完全相同 |
| 轮询超时 | 模型加载/排队 | 首次加载较慢；增大 `--timeout` |
| 脚本格式错 | 没用 `[S1]`/`[S2]` 标注 | 每行必须以 `[S1]` 或 `[S2]` 开头 |

## 限制

- 两段参考音频应为**不同人**，才能体现双人对话效果（同人则音色相同）
- 参考音频建议清晰人声、5~15 秒
- 对话脚本过长会显著增加合成时间
- S1/S2 情绪各自独立设置，互不影响
