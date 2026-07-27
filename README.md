# Osprey Skill Market

自托管、零云依赖的 AI 技能市场。浏览与检索技能包,粘贴一条提示词,AI 助手(Claude Code / Cursor / Windsurf / Codex 等)自动拉取并装载技能 —— 无需命令行,无需手动配置。

## 它解决什么问题

AI 助手的「技能」本质是 `skills/<slug>/` 下的一组文件:`skill.json`(结构化元数据)+ `SKILL.md`(给助手读的自然语言正文)。手工安装要 clone、解压、放目录,门槛高。Skill Market 把这套流程收口成:一个可浏览的网页 + 一条触发安装的提示词协议。

## 核心机制

- **Indexer 驱动导入**:API 启动时扫描 `skills/*/skill.json`,计算 SHA-1,**跳过未变更的技能**(增量导入)。每个新/变更技能:upsert 到 SQLite、读 `SKILL.md` 正文入库、记录文件树、推导计费类型、计算评分、同步版本记录。
- **一键安装协议**:每个技能有一条对应的安装提示词,形如「根据 `https://<host>/api/install/<slug>.md`,安装 <slug> 技能」。该 URL 由 API 动态返回对应技能的 `SKILL.md` 原文,助手读取后自动完成下载、解压、登记。
- **运行时自洽**:数据库自含 `SKILL.md` 正文与文件清单,运行时不依赖磁盘读技能内容。

## 技术栈

pnpm monorepo,Node `>=20`。

| 包 | 内容 |
|---|---|
| `apps/api` | NestJS 10 + Prisma 5 + SQLite,`archiver` 流式 zip 下载 |
| `apps/web` | React 18 + Vite 5 + Tailwind 3 + React Query 5 + react-markdown |
| `packages/shared` | 纯 TS 类型(`SkillDetail` / `SkillListItem` / 枚举) |
| `skills/` | 技能包目录(只读挂载到 API) |

零云厂商锁定:无 Postgres / Redis / CDN 依赖。

## 快速开始

```bash
# 安装依赖
pnpm install

# 生成 Prisma 客户端
pnpm db:generate

# 启动 API(3001)+ Web(Vite 默认端口)
pnpm dev
# 或分别启动
pnpm dev:api
pnpm dev:web
```

环境变量见 `.env.example`:`API_PORT`、`WEB_PUBLIC_PORT`、`VITE_API_BASE_URL`、`SKILLS_DIR`。

## API 速览

所有响应包裹 `{code:0, data, message}`。

| 方法 | 路由 | 用途 |
|---|---|---|
| GET | `/api/skills` | 技能列表,支持 `keyword/category/runtimeType/billing/source/sortBy` 筛选 |
| GET | `/api/v1/skills/:slug` | 技能详情(含 readme 正文、文件树、envVars、quickstart) |
| GET | `/api/v1/skills/:slug/versions` | 版本时间线 |
| GET | `/api/v1/skills/:slug/download` | 整目录 zip 流式下载,异步 `installCount+1` |
| GET | `/api/install/:slug.md` | 返回 `SKILL.md` 原文,`installCount+1`(安装协议入口) |
| GET | `/api/v1/categories` | 分类列表 |
| GET | `/api/v1/showcase/:type` | 精选/热门/推荐(`featured`/`top`/`hot`/`recommended`) |

## 技能格式

```
skills/<slug>/
├── skill.json     # 元数据:name, version, runtime_type, billing, category, api, env_vars, changelog, quickstart…
├── SKILL.md       # 给 AI 读的正文(YAML front matter + markdown)
└── references/    # 可选,参考文档
```

`runtime_type`:`gateway_migrated_api` / `gateway_async_api` / `external_api` / `local`
`billing`:由 runtime 推导(`local → free`,其余 `paid`),`skill.json` 可显式覆盖。

新增技能:丢目录到 `skills/` → 重启 API(或 `pnpm sync`)→ Indexer 增量导入。现有 `installCount` 不会因重新导入被重置。

## 部署

`docker-compose.yml` 两个服务,无云依赖:

- **api**:`node:20-bookworm-slim` 多阶段构建,装 `openssl` 供 Prisma 运行。SQLite 文件落在 named volume `skill_market_data`。`skills/` 以只读 bind mount 挂入 —— 加技能不用重新构建镜像。
- **web**:`nginx:1.27-alpine` 承载构建产物,反代 `/api → http://api:3001`,对外暴露 `${WEB_PUBLIC_PORT:-38090}:80`。

```bash
docker compose up -d --build
```

数据迁移 = 复制 `skill_market_data` volume。详细部署见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 项目结构

```
apps/api/        NestJS API + Prisma schema
  src/skills/      技能 controller/service
  src/indexer/    启动时增量导入
  prisma/         schema + SQLite
apps/web/        React 前端
  src/pages/      Home / SkillList / SkillDetail
  src/components/ Layout / InstallPromptBar / SkillCard
packages/shared/ 共享 TS 类型
skills/          技能包目录(160+)
docs/            SPEC.md / DEPLOY.md / skill-market-guide.md
```

## 文档

- [docs/SPEC.md](docs/SPEC.md) — 完整技术规格
- [docs/DEPLOY.md](docs/DEPLOY.md) — 部署指南
- [docs/skill-market-guide.md](docs/skill-market-guide.md) — 如何添加新技能

## License

Private.
