# `gpt-image-2` 参数说明

本技能默认用的模型（ospreyai 后端）的调用方式。日常只需要「参数约定」里那几个，
这份说明在需要用到非常规参数时再看。

**CRITICAL INSTRUCTION FOR AGENT**:
Run `node scripts/gen.mjs --task wear-everything ...` to get results.

```bash
node scripts/gen.mjs --task wear-everything --help

Options:
  --task <name>              技能名，决定默认模型与尺寸（见 lib/tasks.json，本技能默认 gpt-image-2）
  --prompt <prompt>          Prompt；或 --prompt-file <path> 从文件读
  --images [images...]       Images [image: url or local path]，顺序即 prompt 里的 image 1/2/3
  --model <id>               覆盖默认模型
  --size <size>              Size，如 1024x1024 / 1024x1536 / 1536x1024
  --quality <quality>        low | medium | high
  --resolution <resolution>  部分后端支持（如 2k）
  --format <format>          输出格式 jpeg | png | webp（即 --imageFormat）
  --batch <n>                一次出 N 张（自动加 -1 -2 后缀）
  --retries <n>              429/5xx 指数退避重试次数（默认 3）
  --timeout <seconds>        单次请求超时（默认 1800）
  --save <path>              下载结果到本地路径（自动建目录）
  --dry-run                  Print payload without executing the tool
  --provider <id>            ospreyai | dlazy | openai | gemini | fal | replicate | ark
  -h, --help                 display help for command
```

> 模型 ID 与参数以后端当前目录为准；换其他后端时参数同样由 `scripts/gen.mjs` 统一翻译，见 [`provider-cli.md`](provider-cli.md)。
