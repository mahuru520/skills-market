---
name: whisper-transcribe
description: "将音频文件（mp3/wav/m4a等）转录为文本，支持校对和生成结构化会议纪要"
metadata:
  {
    "openclaw":
      {
        "emoji": "🎙️",
        "requires": { "bins": ["curl"] },
        "triggers":
          [
            "转录音频",
            "语音转文字",
            "录音转文字",
            "会议纪要",
            "语音识别",
            "Whisper",
            "转录",
          ],
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "curl",
              "bins": ["curl"],
              "label": "Install curl",
            },
          ],
      },
  }
---

# Whisper 语音转录技能

将音频文件转录为文本，自动校对并生成结构化的会议/讨论记录。

## 触发条件

当用户请求以下操作时，使用此技能：

- 转录音频文件（mp3、wav、m4a、flac、ogg 等）
- 将录音转为文字稿
- 生成会议纪要或讨论总结
- 对语音识别结果进行校对和整理

## API 配置

### 服务地址

| 服务        | 地址                                                      | 说明   |
| ----------- | --------------------------------------------------------- | ------ |
| Whisper API | `https://mini-tokens.ospreyai.cn/v1/audio/transcriptions` | 主服务 |

### API Key 获取（自动）

**不要硬编码 API Key。** 执行转录前，按以下优先级自动获取：

1. **环境变量 `$NEWAPI_API_KEY`** — 运行 `echo $NEWAPI_API_KEY` 获取
2. **OpenClaw 配置** — 通过 `gateway config.get` 读取 `models.providers.ospreyai.apiKey`（注意：config.get 返回的 key 可能被脱敏为 `__OPENCLAW_REDACTED__`，此时回退到环境变量）

**推荐做法：** 在命令中直接引用环境变量，无需手动填入：

```bash
API_KEY="$NEWAPI_API_KEY"
```

> 如果环境变量为空，再通过 `gateway config.get` 查找，若仍被脱敏则提示用户手动提供。

## 命令

### 基础转录

```bash
API_KEY="$NEWAPI_API_KEY"

curl -X POST "https://mini-tokens.ospreyai.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@音频文件路径.m4a" \
  -F "model=whisper-1"
```

### 完整参数调用

```bash
API_KEY="$NEWAPI_API_KEY"

curl -X POST "https://mini-tokens.ospreyai.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@音频文件路径.m4a" \
  -F "model=whisper-1" \
  -F "language=zh" \
  -F "response_format=json" \
  -F "temperature=0.2"
```

### 输出带时间戳的格式

```bash
API_KEY="$NEWAPI_API_KEY"

curl -X POST "https://mini-tokens.ospreyai.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@音频文件路径.m4a" \
  -F "model=whisper-1" \
  -F "language=zh" \
  -F "response_format=srt"
```

### 参数说明

| 参数              | 必填 | 说明                                                   |
| ----------------- | ---- | ------------------------------------------------------ |
| `file`            | ✅    | 音频文件（mp3, wav, m4a, flac, ogg, webm 等）          |
| `model`           | ✅    | 模型名称：固定为 `whisper-1`                           |
| `language`        | ❌    | 语言代码：`zh`（中文）、`en`（英文）等，不传则自动检测 |
| `response_format` | ❌    | 输出格式：`json`（默认）、`text`、`srt`、`vtt`         |
| `temperature`     | ❌    | 采样温度 (0-1)，默认 0，值越低越稳定                   |

### response_format 选择指南

| 格式   | 适用场景                                   |
| ------ | ------------------------------------------ |
| `json` | 需要获取完整元数据（语言、时长、分段信息） |
| `text` | 只需纯文本内容                             |
| `srt`  | 需要字幕时间戳，可用于视频字幕             |
| `vtt`  | Web 字幕格式，适用于网页播放器             |

## 返回格式

### JSON 格式（默认）

```json
{
  "text": "转录的完整文本内容...",
  "language": "zh",
  "duration": "333.74",
  "segments": [...]
}
```

### 字段说明

| 字段       | 类型   | 说明                               |
| ---------- | ------ | ---------------------------------- |
| `text`     | string | 完整转录文本                       |
| `language` | string | 检测到的语言代码                   |
| `duration` | string | 音频时长（秒）                     |
| `segments` | array  | 分段信息，包含起止时间戳和对应文本 |

## 工作流程

### 步骤 1：确认文件

1. 检查音频文件路径是否存在
2. 检查文件大小（超过 25MB 需要分段处理）
3. 确认文件格式是否受支持

### 步骤 2：转录音频

1. 根据音频内容指定 `language` 参数（建议明确指定以提高准确性）
2. 调用 Whisper API 进行转录
3. 如需时间戳，使用 `srt` 或 `vtt` 格式

### 步骤 3：保存原始结果

将 API 返回的完整 JSON 保存为：

```
{输出目录}/whisper转录原始返回.json
```

### 步骤 4：校对文本

对 `text` 字段进行校对：

| 校对类型 | 说明                     | 示例                   |
| -------- | ------------------------ | ---------------------- |
| 专有名词 | 修正产品名、公司名等     | OpenCloud → OpenClaw   |
| 同音错字 | 修正语音识别的同音错误   | 罗牙 → 龙虾            |
| 标点断句 | 添加正确的标点和段落分隔 | 长句拆分、添加逗号句号 |
| 技术术语 | 修正技术词汇             | mcdon → Markdown       |

### 步骤 5：生成结构化文稿

根据内容类型选择输出格式：

| 内容类型  | 输出格式                         |
| --------- | -------------------------------- |
| 会议记录  | 包含参会人、议题、结论、待办事项 |
| 访谈记录  | 包含提问与回答的对话格式         |
| 演讲/培训 | 包含章节标题、要点列表           |
| 通用讨论  | 包含主题、要点、结论             |

### 步骤 6：保存文件

| 文件类型  | 文件名                     | 说明                   |
| --------- | -------------------------- | ---------------------- |
| 原始 JSON | `whisper转录原始返回.json` | API 原始返回，用于回溯 |
| 初稿      | `{主题}.md`                | 未经校对的转录文本     |
| 校对版    | `{主题}-校对版.md`         | 校对后的最终文稿       |

## 常见校对对照表

| 语音识别结果 | 正确内容     | 错误类型 |
| ------------ | ------------ | -------- |
| OpenCloud    | OpenClaw     | 专有名词 |
| Opcrow       | OpenClaw     | 专有名词 |
| mcdon        | Markdown     | 技术术语 |
| 罗牙         | 龙虾         | 同音错字 |
| 感谢去办公   | 格式，然后去 | 断句错误 |
| Mark Down    | Markdown     | 技术术语 |
| API key      | API Key      | 大小写   |
| Open AI      | OpenAI       | 专有名词 |

## 错误处理

| 错误                  | 原因          | 解决方案                                |
| --------------------- | ------------- | --------------------------------------- |
| 401 Unauthorized      | API Key 无效  | 检查 `$NEWAPI_API_KEY` 环境变量是否有效 |
| 413 Payload Too Large | 文件超过 25MB | 使用 ffmpeg 分段后分别转录              |
| 429 Too Many Requests | 请求频率过高  | 稍后重试                                |
| 500/502/503           | 服务端错误    | 稍后重试                                |

## 文件大小处理

音频文件超过 25MB 时，使用 ffmpeg 分段：

```bash
# 将音频按 10 分钟分段
ffmpeg -i 长音频.m4a -f segment -segment_time 600 -c copy 分段_%03d.m4a

# 逐段转录后合并
for f in 分段_*.m4a; do
  curl -X POST "https://mini-tokens.ospreyai.cn/v1/audio/transcriptions" \
    -H "Authorization: Bearer $NEWAPI_API_KEY" \
    -F "file=@$f" \
    -F "model=whisper-1" \
    -F "language=zh"
done
```

## 注意事项

1. **隐私安全**：音频内容可能包含敏感信息，处理完毕后及时清理临时文件
2. **文件大小**：API 限制 25MB，超限需用 ffmpeg 分段
3. **语言检测**：建议明确指定 `language` 参数提高中文准确性
4. **人工校对**：AI 转录结果务必人工校对后再正式使用
5. **音频质量**：背景噪音大的录音准确率会下降，建议使用降噪预处理

## 支持的音频格式

| 格式         | 扩展名     | 说明               |
| ------------ | ---------- | ------------------ |
| MPEG Audio   | mp3        | 常见压缩格式       |
| MPEG-4 Audio | m4a, mp4   | Apple 常用格式     |
| WAV          | wav        | 无损格式，文件较大 |
| FLAC         | flac       | 无损压缩格式       |
| OGG          | ogg        | 开源格式           |
| WebM         | webm       | Web 格式           |
| MPEG         | mpeg, mpga | 通用视频/音频格式  |
