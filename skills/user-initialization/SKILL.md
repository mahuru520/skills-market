---
name: user-initialization
description: 用户初始化技能。用于首次使用时完成目录动态探测与设置、掌握技能扩展规则、建立输出目录约定,并快速了解本项目技能清单。触发条件：(1) 新用户首次接入 (2) 需要设置用户目录与系统目录 (3) 用户希望了解或更新可用技能
---

# 用户初始化技能

## 目标

帮助用户在第一次使用时完成以下事项：

1. 动态探测并设置目录约定（用户目录、工作目录、输出目录）
2. 默认安装初始化必备技能
3. 学会技能扩展规则
4. 查看并按需更新本项目技能清单

## 初始化目录约定（必须先完成）

### 为什么需要动态发现

不同 OpenClaw 部署/变体使用不同的目录布局，硬编码路径会在环境切换时失效。常见变体：

| 环境 | 用户目录 | 工作目录 |
|------|---------|---------|
| 标准 Docker | `/data/file/` | `/root/.openclaw/workspace/` |
| Osprey | `/root` | `/root/.openclaw/workspace/` |
| 自定义龙虾 | `/root/.openclaw/workspace/` | `/root/.openclaw/workspace/` |
| Acsclaw | `/root/.openclaw/filebrowser-workspace/srv/users/files/` | `/root/.openclaw/openclaw-workspace/` |

因此**必须动态探测**，不应假设某个固定路径。探测逻辑封装在本技能的 `scripts/detect-dirs.sh` 中。

### 执行方式

运行本技能自带的探测脚本：

```bash
bash skills/user-initialization/scripts/detect-dirs.sh --write
```

脚本按以下优先级探测三个目录，取每个第一个可用的结果：

1. **环境变量**：`OPENCLAW_HOME`（用户目录）、`OPENCLAW_WORKSPACE`（工作目录）、`OPENCLAW_OUTPUT_DIR`（输出目录）
2. **配置文件**：`~/.openclaw/config.yaml` 等位置的 `home` / `workspace` 字段
3. **文件系统探测**：依次检查候选路径是否存在（见下表）
4. **询问用户**：以上全失败时，脚本输出 `NEEDS_INPUT`，此时直接向用户提问目录位置

候选路径（按探测顺序）：

| 目录 | 候选 |
|------|------|
| 用户目录 | `/data/file/` → `/root/.openclaw/filebrowser-workspace/srv/users/files/` → `/root/` → `~/.openclaw/workspace/` |
| 工作目录 | `/root/.openclaw/workspace/` → `/root/.openclaw/openclaw-workspace/` → `~/.openclaw/workspace/` |
| 输出目录 | 默认等于用户目录；若设置了 `OPENCLAW_OUTPUT_DIR` 则以其覆盖 |

`--write` 参数会让脚本把结果写入工作目录下的 `TOOLS.md`（幂等：重复运行会替换旧的"目录约定"区块，保留其他内容）。格式：

```markdown
## 目录约定（自动探测）
- **用户数据目录**: <探测到的用户目录>
- **系统工作目录**: <探测到的工作目录>
- **输出目录**: <探测到的输出目录>
- **探测时间**: <ISO-8601>
- **探测来源**: detect-dirs.sh (env > config > filesystem)
```

若脚本输出 `WRITE_SKIPPED` 或 `NEEDS_INPUT`，说明探测未完全成功，需根据提示询问用户后手动写入 TOOLS.md。

### TOOLS.md 是单一事实源

探测完成后，结果记录在工作目录的 `TOOLS.md` 中。此后的所有 skill 和操作都应**从 TOOLS.md 读取目录约定**，不再各自硬编码路径。

### 执行要点

1. 运行 `detect-dirs.sh --write` 完成动态探测
2. 确认 TOOLS.md 已写入三个目录
3. 验证三个目录均可正常读写
4. 后续涉及用户文件时默认从 TOOLS.md 记录的用户目录开始

## 输出目录约定（全库规范）

生成/下载文件时，保存路径**必须**从 `get-output-dir.sh` 获取，不要自行写死路径。

### 获取输出目录

```bash
# 方式一：调用 helper 脚本（推荐，自动处理优先级与回退）
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh)

# 方式二：直接读环境变量（仅当已设置时）
OUT="$OPENCLAW_OUTPUT_DIR"
```

`get-output-dir.sh` 的优先级：`OPENCLAW_OUTPUT_DIR 环境变量 → TOOLS.md 的"输出目录" → TOOLS.md 的"用户数据目录"（兼容旧版） → detect-dirs.sh 探测 → 失败报错`。

### 已遵循约定的技能

| 技能 | 说明 |
|------|------|
| `comfyui-image-generation` | 图片下载到输出目录 |
| `comfyui-video-generation` | 视频下载到输出目录 |
| `invoice-ocr` | 识别结果写入输出目录（`OUT` 环境变量优先） |
| `pptx-generator` | 演示文稿写入输出目录 |

新增带下载/保存功能的技能时，应参照上述技能实现，调用 `get-output-dir.sh` 而非硬编码路径。

## AI 行为准则配置（建议执行）

在工作目录下的 `SOUL.md` 中追加以下行为准则（工作目录路径从 TOOLS.md 读取，下同）：

```
**When something fails, find the working method first.**

Before trying different approaches:
1. Check for existing skill docs / manuals
2. Check server capabilities (models, nodes)
3. Use previously verified methods
4. Don't repeat what already failed
```

执行方式：直接编辑 `SOUL.md` 文件，将上述内容追加到文件末尾。

## 默认安装技能（建议作为初始化标准动作）

在执行用户初始化时，默认安装以下技能：

1. `skill-expansion` — 建立技能扩展来源优先级与安装规则
2. `self-improving-agent` — 建立持续记录学习、错误和修正的机制

执行要求：

1. 将上述技能复制或安装到工作目录下的 `skills/` 子目录（工作目录路径从 TOOLS.md 读取）
2. 重新读取技能目录，确认技能均可用
3. 若缺失任一技能，优先从本仓库补齐后再继续后续初始化流程

## 技能扩展规则（用户必须理解）

当现有技能无法满足需求时，按以下优先级扩展：

1. GitLab 仓库：`https://gitlab.ospreyai.cn/openclaw/xiaoyi_tools`
2. 本仓库离线资源：`packages/` 与 `tools/`
3. 本地自定义技能目录
4. OpenClaw 官方 skill hub

扩展流程：

1. 检查是否已有可复用技能
2. 下载/复制技能到工作目录下的 `skills/` 子目录（路径从 TOOLS.md 读取）
3. 重新读取并验证技能可用

## 当前项目技能清单（标准 skill）

| skill | 主要功能 |
|---|---|
| `comfyui-image-generation` | ComfyUI 文生图（提交工作流、查队列、下图片） |
| `comfyui-video-generation` | ComfyUI 图生视频（上传图片、生成并下载 mp4） |
| `md-to-pdf` | Markdown 转 PDF（含离线安装包兜底） |
| `minimax-docx` | DOCX 文档创建、编辑与排版 |
| `minimax-pdf` | 高质量 PDF 生成、填充与重排 |
| `minimax-xlsx` | Excel / 电子表格读取、创建、编辑与校验 |
| `pptx-generator` | PowerPoint 演示文稿生成、编辑与读取 |
| `problem-solving-debug` | 问题排查与根因分析 |
| `openclaw-ui-customization` | OpenClaw UI 定制（Logo、favicon、标题） |
| `openclaw-qq-channel` | QQ 机器人渠道接入 |
| `openclaw-dingtalk-channel` | 钉钉机器人渠道接入 |
| `openclaw-feishu-plugin` | 飞书插件安装与配置 |
| `openclaw-wecom-channel` | 企业微信机器人接入 |
| `skill-expansion` | 技能扩展规则与来源优先级 |
| `user-initialization` | 首次使用初始化（本技能） |
| `self-improving-agent` | 持续自改进：记录学习、错误和修正 |

## 技能清单自动更新建议

当技能目录有新增/删除时，执行以下刷新策略：

1. 重新扫描 `skills/*/SKILL.md`
2. 按目录名重建技能清单（避免手工遗漏）
3. 若清单有变化，更新本文件中的“当前项目技能清单”

建议在以下时机触发刷新：

- 新增或删除任意 skill 目录后
- 版本发布前
- 用户明确要求“同步最新技能列表”时

## 验收标准

- 三个目录（用户/工作/输出）已通过动态探测确定，并写入 TOOLS.md（非硬编码）
- 用户能说清各目录及用途
- 默认技能 `skill-expansion`、`self-improving-agent` 已安装可用
- 用户知道技能扩展优先级与安装路径
- 技能清单与 `skills/*/SKILL.md` 实际结果一致
- 带下载/保存功能的技能通过 `get-output-dir.sh` 获取输出目录，无硬编码路径
