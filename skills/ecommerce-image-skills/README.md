<div align="center">

# 🛒 Ecommerce Image Skills

**12 个电商出图 Agent Skills · GPT Image 2.5（Flare / Sunburst）**<br>
**12 Agent Skills for ecommerce product images — Amazon · 淘宝天猫 · Shopee · TikTok Shop · 小红书**

[中文](#-中文) · [English](#-english) · [效果展示 Showcase](#-效果展示--showcase) · [Skills](#-skills--技能列表)

<a href="#-效果展示--showcase"><img src="https://upload.maynor1024.live/file/1791116626949_ecomskills-gallery-wall.jpg" width="900" alt="Gallery wall: one product photo in, Amazon white-background main image, lifestyle scene, infographic, Xiaohongshu cover, sale banner and on-model try-on out — real GPT Image 2.5 outputs"></a>

<sub>↑ 全部是本仓库 skill 的真实输出（GPT Image 2.5，未 PS） · All real outputs from these skills, no retouching</sub>

<img src="https://upload.maynor1024.live/file/1791116577817_ecomskills-before-after.gif" width="760" alt="Before → after slideshow: casual phone photo of a bottle and a flat-lay hoodie turned into six platform-ready ecommerce images">

<sub>Before → After：同一张随手拍 → 6 种平台图 · one casual photo → six platform-ready images</sub>


</div>

---

## 🇨🇳 中文

> ### 🚀 使用方式 / 在哪里用

把「拍商品图 + 美工做图」拆成 12 个可单独安装的 Agent Skill。丢一张手机随手拍的商品照片给 Claude Code / Codex / Cursor，它就会按平台规则出白底主图、场景图、卖点图、A+、尺寸图、模特图、大促 Banner、小红书封面、淘宝详情长图……

**和一堆 prompt 的区别：**

- 🔒 **产品身份锁定**：每个 skill 第一步先锁定形状 / 颜色 / Logo / 文字，并原样带进每一条提示词，减少"图很好看但产品被改了"。
- 📐 **平台规格内置**：Amazon 主图（#FFFFFF、≥85%）、A+ 模块尺寸、淘宝 750 宽详情、小红书 3:4、各平台 Banner 尺寸。
- 🧠 **模型路由**：默认 **Flare**（快、适合出场景和多版本）；需要保留 Logo/文字、局部编辑时切 **Sunburst**。
- 🛠 **脚本做确定性的事**：白底/占比检查与修复、A+ 裁切、拼图、详情页拼接切片、批量换背景（断点续跑 + 预算上限）。
- 🚦 **三种出图方式**：①agent 自带生图工具 ②配置 `GPTIMAGE_API_KEY`（任意 OpenAI 兼容接口）用 `scripts/generate.py` ③都没有时输出最终提示词 + 一个在线运行链接。


### 🚀 使用

直接对 agent 说：

```text
用 amazon-white-background 把 ./photos/bottle.jpg 做成亚马逊白底主图，并跑检查脚本
给这个水杯出一整套 Amazon 7 张图（ecommerce-listing-suite），先给我计划
用 xiaohongshu-cover 做 3 个小红书封面，标题「一整天都冰的水杯」
把 ./photos 里 40 张图批量换成纯白背景，最多花 40 次调用
```

### 🔑 出图方式（可选 API Key）

| 方式 | 条件 | 做法 |
|---|---|---|
| ① 内置工具 | agent 自带生图（如 Codex imagegen） | 自动使用 |
| ② API Key | 设置 `GPTIMAGE_API_KEY`，可选 `GPTIMAGE_BASE_URL`（推荐 Osprey 网关 `https://open.ospreyai.cn/v1`，key 在 Osprey 平台 https://open.ospreyai.cn 申请；默认 `https://api.openai.com`，任何 OpenAI 兼容网关都行） | `python scripts/generate.py --model sunburst --image product.jpg --prompt-file p.txt` |
| ③ 无 key | — | 输出最终提示词 + 一个 [gptimage2.asia](https://gptimage2.asia/ecommerce?utm_source=github&utm_medium=readme&utm_campaign=ecommerce-image-skills&utm_content=zh-route-c) 在线运行链接（预填提示词，上传商品图即可） |

### 模型选择 / Model routing

| 默认 **Flare** `gpt-image-2.5-flare` | 切 **Sunburst** `gpt-image-2.5-sunburst` |
|---|---|
| 新场景、背景、版式、快速多版本 | 必须保留 Logo / 标签 / 小字 |
| 文生图概念图 | 局部编辑：换背景、换色、去杂物 |
| 草稿供挑选 | 最终主图、文字密集的信息图 / 尺寸表 |

---

## 🖼 效果展示 / Showcase

同一张手机随手拍的水杯照片（卫衣用平铺图）→ GPT Image 2.5 真实生成，未经 PS（白底图仅跑了一次 `check_main_image.py --fix` 把近白像素统一为 #FFFFFF）。<br>
One casual phone photo in → real GPT Image 2.5 outputs, no manual retouching (the main image only went through `check_main_image.py --fix`). Prompts: [docs/showcase-prompts.md](docs/showcase-prompts.md).

| Skill | 输入 Input | 输出 Output | |
|---|---|---|---|
| **白底主图 · White-bg main**<br>`amazon-white-background`<br><sub>Sunburst，`check_main_image.py --fix` 后 100% #FFFFFF · coverage 87%</sub> | <img src="https://upload.maynor1024.live/file/1791083794791_ecomskills-input-bottle.webp" width="200" alt="input"> | <img src="https://upload.maynor1024.live/file/1791083782849_ecomskills-01-white-bg.webp" width="240" alt="amazon-white-background output"> 
| **生活场景 · Lifestyle**<br>`lifestyle-scene`<br><sub>Flare，户外徒步场景</sub> | <img src="https://upload.maynor1024.live/file/1791083794791_ecomskills-input-bottle.webp" width="200" alt="input"> | <img src="https://upload.maynor1024.live/file/1791083783179_ecomskills-02-lifestyle.webp" width="240" alt="lifestyle-scene output"> 
| **卖点信息图 · Infographic**<br>`selling-point-infographic`<br><sub>Sunburst，英文文案逐字渲染</sub> | <img src="https://upload.maynor1024.live/file/1791083794791_ecomskills-input-bottle.webp" width="200" alt="input"> | <img src="https://upload.maynor1024.live/file/1791083790675_ecomskills-03-infographic.webp" width="240" alt="selling-point-infographic output"> 
| **模特上身 · Try-on**<br>`model-try-on`<br><sub>Flare，平铺卫衣 → 模特</sub> | <img src="https://upload.maynor1024.live/file/1791083790600_ecomskills-input-hoodie.webp" width="200" alt="input"> | <img src="https://upload.maynor1024.live/file/1791083786719_ecomskills-04-model-tryon.webp" width="240" alt="model-try-on output"> 
| **小红书封面 · RED cover**<br>`xiaohongshu-cover`<br><sub>Flare，中文大字标题 3:4</sub> | <img src="https://upload.maynor1024.live/file/1791083794791_ecomskills-input-bottle.webp" width="200" alt="input"> | <img src="https://upload.maynor1024.live/file/1791083788447_ecomskills-05-xhs-cover.webp" width="240" alt="xiaohongshu-cover output"> 
| **大促 Banner · Sale banner**<br>`sale-banner`<br><sub>Flare，11.11 Shopee / TikTok Shop 风格</sub> | <img src="https://upload.maynor1024.live/file/1791083794791_ecomskills-input-bottle.webp" width="200" alt="input"> | <img src="https://upload.maynor1024.live/file/1791083786654_ecomskills-06-sale-banner.webp" width="360" alt="sale-banner output">

> 输入图本身也是 AI 生成的虚构产品「AURA」，仅作演示。 The input product "AURA" is fictional (AI-generated) for demo purposes.

---

## 🧩 Skills / 技能列表

| Skill | 中文说明 | 默认模型 |
|---|---|---|
| [`amazon-white-background`](skills/amazon-white-background/SKILL.md) | Amazon 白底主图：纯白 #FFFFFF、主体 ≥85%、无文字，附 Python 检查/修复脚本 | Sunburst |
| [`lifestyle-scene`](skills/lifestyle-scene/SKILL.md) | 生活场景图：厨房/户外/办公/健身等场景库，产品保真 | Flare |
| [`model-try-on`](skills/model-try-on/SKILL.md) | 模特上身图：平铺/挂拍 → 模特试穿，保留面料、颜色、Logo | Sunburst |
| [`selling-point-infographic`](skills/selling-point-infographic/SKILL.md) | 卖点信息图：一图一卖点、图标+标注线，文案逐字确认 | Sunburst |
| [`amazon-a-plus`](skills/amazon-a-plus/SKILL.md) | A+ 页面模块：970×600 / 970×300 / 300×300 / 1464×600…，统一风格锁 + 裁切脚本 | Flare |
| [`size-chart`](skills/size-chart/SKILL.md) | 尺寸规格图：cm/inch 双单位标注、服装尺码表，数字只用用户提供的 | Sunburst |
| [`multi-angle-set`](skills/multi-angle-set/SKILL.md) | 多角度套图：正/侧/背/顶/45°/细节，统一光位背景 + 拼图脚本 | Sunburst |
| [`sale-banner`](skills/sale-banner/SKILL.md) | 大促 Banner：淘宝天猫 / Shopee / Lazada / TikTok Shop / Amazon 尺寸与大促配色 | Flare |
| [`batch-background-swap`](skills/batch-background-swap/SKILL.md) | 批量换背景 / SKU 换色：断点续跑、重试、预算上限、CSV 日志 | Sunburst |
| [`xiaohongshu-cover`](skills/xiaohongshu-cover/SKILL.md) | 小红书封面 3:4：6 种爆款版式、大字标题、种草风 | Flare |
| [`taobao-detail-long-image`](skills/taobao-detail-long-image/SKILL.md) | 淘宝/天猫/拼多多 750 宽详情长图：分屏规划 + 拼接切片脚本 | Flare |
| [`ecommerce-listing-suite`](skills/ecommerce-listing-suite/SKILL.md) | 总入口：按平台规划整套图（Amazon 7 张 / 淘宝 5+详情 / 小红书），调度上面 11 个 skill 并质检 | Auto |

---

## 🇺🇸 English

Twelve installable Agent Skills that turn a casual product photo into platform-ready ecommerce images — Amazon main images, lifestyle scenes, infographics, A+ modules, size charts, on-model shots, sale banners, Xiaohongshu covers and Taobao detail pages — from inside Claude Code, Codex, Cursor or any agent that reads `SKILL.md`.

**What makes it different from a prompt pack**

- 🔒 **Product identity lock** — every skill first locks shape / colour / logo / text and carries that block into every prompt.
- 📐 **Platform specs built in** — Amazon main image (#FFFFFF, ≥85% coverage), A+ module sizes, 750-px detail pages, 3:4 RED covers, banner sizes.
- 🧠 **Model routing** — **Flare** by default; **Sunburst** for text-preserving and local edits.
- 🛠 **Scripts for deterministic steps** — white-background/coverage check & fix, A+ crops, grids, long-image stitching, batch edits with resume and a budget cap.
- 🚦 **Three generation routes** — (a) the agent's built-in image tool, (b) `GPTIMAGE_API_KEY` + any OpenAI-compatible `GPTIMAGE_BASE_URL` via `scripts/generate.py`, (c) otherwise the final prompt plus a one-click link to run it online.

### Use

```text
Use amazon-white-background on ./photos/bottle.jpg and run the check script.
Plan a full 7-image Amazon set for this bottle with ecommerce-listing-suite — show me the plan first.
Batch-replace backgrounds in ./photos with pure white, cap at 40 API calls.
```

### Skills

| Skill | What it does | Default model |
|---|---|---|
| [`amazon-white-background`](skills/amazon-white-background/SKILL.md) | Amazon main image: pure #FFFFFF, product ≥85%, no text — with a Python check/fix script | Sunburst |
| [`lifestyle-scene`](skills/lifestyle-scene/SKILL.md) | Lifestyle / in-use scenes from a scene library, product kept identical | Flare |
| [`model-try-on`](skills/model-try-on/SKILL.md) | On-model try-on from flat-lay or hanger shots, fabric & logo preserved | Sunburst |
| [`selling-point-infographic`](skills/selling-point-infographic/SKILL.md) | Feature infographics: one benefit per image, icons & callouts, exact copy | Sunburst |
| [`amazon-a-plus`](skills/amazon-a-plus/SKILL.md) | A+ Content modules (970×600, 970×300, 300×300, 1464×600 …) with style lock + crop script | Flare |
| [`size-chart`](skills/size-chart/SKILL.md) | Size / dimension charts in cm + inch and apparel size tables — user numbers only | Sunburst |
| [`multi-angle-set`](skills/multi-angle-set/SKILL.md) | Multi-angle gallery with one lighting/background lock + grid script | Sunburst |
| [`sale-banner`](skills/sale-banner/SKILL.md) | Sale banners for Taobao/Tmall, Shopee, Lazada, TikTok Shop, Amazon — sizes & campaign presets | Flare |
| [`batch-background-swap`](skills/batch-background-swap/SKILL.md) | Batch background swap / SKU recolour with resume, retries, budget cap, CSV log | Sunburst |
| [`xiaohongshu-cover`](skills/xiaohongshu-cover/SKILL.md) | Xiaohongshu (RED) 3:4 covers in 6 proven layouts | Flare |
| [`taobao-detail-long-image`](skills/taobao-detail-long-image/SKILL.md) | Taobao/Tmall/PDD 750-px detail page: screen plan + stitch & slice script | Flare |
| [`ecommerce-listing-suite`](skills/ecommerce-listing-suite/SKILL.md) | Orchestrator: plans a full listing set per platform, calls the 11 skills, QA every image | Auto |

---