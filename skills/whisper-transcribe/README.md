# Whisper 语音转录

使用 Whisper API 将音频文件转录为文本，支持校对和生成结构化会议纪要。

## Quick Start

```bash
API_KEY="sk-vyjU4Rxxx4ddgyW"

# 基础转录
curl -X POST "https://mini-tokens.ospreyai.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@音频文件.m4a" \
  -F "model=whisper-1" \
  -F "language=zh"

# 输出 SRT 字幕格式
curl -X POST "https://mini-tokens.ospreyai.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@音频文件.m4a" \
  -F "model=whisper-1" \
  -F "response_format=srt"
```

## Directory Structure

```
whisper-transcribe/
└── SKILL.md
```

## When to Use

- **whisper-transcribe**：音频转录、语音转文字、会议纪要生成
- 配合 `minimax-docx` 或 `minimax-pdf` 可将转录结果生成正式文档

## Output Files

| 文件 | 说明 |
|------|------|
| `whisper转录原始返回.json` | API 原始返回 |
| `{主题}.md` | 未校对初稿 |
| `{主题}-校对版.md` | 校对后终稿 |

## Key Parameters

| 参数 | 说明 |
|------|------|
| `language=zh` | 建议明确指定语言提高准确性 |
| `response_format=srt` | 需要时间戳时使用 |
| `temperature=0` | 默认值，最稳定的输出 |

## Verification

- API 返回 200 且 `text` 字段非空
- 原始 JSON 保存成功
- 校对版文稿生成并保存

## References

- `SKILL.md` — 完整技能定义（API 参数、工作流程、校对对照表、错误处理）
