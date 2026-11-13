<!-- 由 scripts/build-skills.mjs 从 shared/references/provider-cli.md 同步生成，不要直接改这里。 -->
# 后端调用参考

技能正文只写「要生成什么」。认证、计费、错误码、输出结构这些每个技能都一样的东西放在这里，
**用到时再读**，不占技能的常驻上下文。

---

## 一、认证

### 默认后端 ospreyai

```bash
export OSPREYAI_API_KEY=sk-...   # OpenAI 兼容网关，生图 / 文本 / 视频一个 key
```

可选 `OSPREYAI_BASE_URL`（默认 `https://open.ospreyai.cn/v1`，任何 OpenAI 兼容网关均可替换）。
key 在 [open.ospreyai.cn](https://open.ospreyai.cn/) 控制台获取。

生图走 `/v1/images/generations` 与 `/v1/images/edits`；文本与视频模型走 `/v1/chat/completions`。

### 其他后端

本技能库不锁定单一厂商。配好任意一家的 key 即可跑：

| 后端 | 环境变量 | 说明 |
| --- | --- | --- |
| `ospreyai` | `OSPREYAI_API_KEY` | 默认，OpenAI 兼容（含 `gpt-image-2`、`qwen-image-*`、`claude-*`、视频模型） |
| `dlazy` | `dlazy login` 或 `DLAZY_API_KEY` | dLazy CLI |
| `openai` | `OPENAI_API_KEY` | 走 `/v1/images/edits` 与 `/v1/images/generations` |
| `gemini` | `GEMINI_API_KEY` | Nano Banana 系列 |
| `fal` | `FAL_KEY` | |
| `replicate` | `REPLICATE_API_TOKEN` | |
| `ark` | `ARK_API_KEY` + `ARK_MODEL` | 火山方舟，模型 ID 需按开通情况填 |

选路优先级：`--provider` 参数 > `PROVIDER` 环境变量 > 第一个配了 key 的 > 无 key 时回落 `dlazy` CLI。

```bash
node scripts/gen.mjs --doctor     # 看当前哪个后端可用
```

各后端的模型 ID 可用 `GEN_MODEL_OSPREYAI` / `GEN_MODEL_OPENAI` / `GEN_MODEL_GEMINI` / `GEN_MODEL_FAL` /
`GEN_MODEL_REPLICATE` / `GEN_MODEL_ARK` 覆盖。**厂商目录会变，以各家最新文档为准。**

---

## 二、两种调用方式

### 方式 A：统一入口（推荐）

```bash
node scripts/gen.mjs --task <技能名> --prompt '...' --images a.jpg b.jpg --save out.jpg
```

它负责：后端选路、默认尺寸档位、失败重试（429/5xx 指数退避）、落盘建目录、成本估算。

```bash
node scripts/gen.mjs --task flat-lay --prompt '...' --dry-run   # 不调用不计费，只看要发什么
node scripts/gen.mjs --help
```

### 方式 B：直接用 dLazy CLI

不想引入 Node 依赖时，也可以装 [dLazy CLI](https://github.com/dlazy-ai/cli)（npm 包 `@dlazy/cli`），
把 `--provider dlazy` 传给 `gen.mjs` 或设 `PROVIDER=dlazy` 走 dLazy 后端，效果等价。

```bash
npx @dlazy/cli@1.2.3 <command>     # 不装全局二进制
```

---

## 三、数据流向

调用 ospreyai 时：提示词、参数与图片（base64 / multipart）发往 `open.ospreyai.cn`，
产出的图片为 b64 或厂商托管 URL，由 `gen.mjs` 直接落盘到本地。这是云端生成 API 的通用形态。
换成其他后端时，数据流向对应厂商。

---

## 四、输出结构

`gen.mjs`（加 `--json`）：

```json
{
  "ok": true,
  "task": "flat-lay",
  "provider": "ospreyai",
  "model": "gpt-image-2",
  "files": ["docs/flat-lay/output-sku001.jpg"],
  "texts": [],
  "estimatedCredits": 60,
  "elapsedMs": 58213
}
```

文本类模型（如质检）产出在信封的 `texts[]`：

```bash
node scripts/gen.mjs --task detect-task --model claude-sonnet-5 --prompt '...' --images x.jpg \
  | python3 -c 'import sys,json;print("\n".join(json.load(sys.stdin)["texts"]))'
```

---

## 五、错误处理

| Code | 类型 | 示例 |
| --- | --- | --- |
| 401 | 未授权 / 无 key | `HTTP 401: ...` |
| 400 | 缺必填参数或参数不合法 | `HTTP 400: ...message...` |
| 402 / 429 | 余额不足 / 限流 | 响应体里的错误 message |
| 5xx | 服务端错误 | `HTTP 500: ...` |
| 本地 | 文件读不到 / 超时 | `Error: ENOENT...` / 请求超时 |

**给 Agent 的硬性要求**

1. 命中余额 / 配额类错误 → 明确告诉用户账户余额不足，并指引去后端控制台查看
   （ospreyai：<https://open.ospreyai.cn/>）。
2. 命中 401 / 缺 key → 告诉用户设置 `OSPREYAI_API_KEY`（或对应后端的环境变量）再继续。
3. 用 `gen.mjs` 时，429 与 5xx 已自动重试；仍失败才向用户报错。
4. **不要**为了「跑通」而偷偷降级参数（尺寸、档位、批量），先问用户。
