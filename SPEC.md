# Skill Market 技术规范（SPEC）

> 仿 skillhub 的轻量级全栈技能市场。导航仅「首页 / 全部技能」;首页去掉快捷入口服务区;详情页仅「概述 / 历史版本」两 Tab + 文件清单区,去掉安全验证/测评报告/效果预览/价格区。不挂 GitLab,技能数据一次性导入 SQLite,换服务器只迁移 DB 文件。

---

## 1. 架构

### 1.1 技术栈

| 层 | 选型 | 选型理由 |
|----|------|----------|
| 前端 | React 18 + Vite + TypeScript | SPA,对齐 skillhub |
| UI | Tailwind + shadcn/ui | 源码进项目,可移植,无内部库依赖 |
| 路由 | react-router-dom v6 | |
| 状态 | zustand + React Query | 列表缓存/分页用 RQ,UI 状态用 zustand |
| Markdown | react-markdown + remark-gfm | 渲染 SKILL.md |
| 后端 | NestJS + TypeScript | 模块化/DI/Swagger/DTO 校验 |
| ORM | Prisma | 一行连接串切库(SQLite→Postgres) |
| DB | SQLite(默认) | 单文件零运维,随目录迁移 |
| 搜索 | SQLite FTS5 | 轻量,无额外服务 |
| 部署 | Docker Compose | 换服务器 `docker compose up`,不绑云厂商 |

### 1.2 数据流(DB 自包含)

```
skills/*/skill.json + SKILL.md   (一次性导入源)
        │  pnpm sync / 首次启动自动导入
        ▼
   SQLite (Prisma) ── FTS5 虚拟表
        │  REST  {code:0, data, message}
        ▼
   NestJS API (/api/...)
        │
        ▼
   React SPA (nginx 托管静态产物)
```

indexer 跑一次把 25 个 skill.json + SKILL.md 正文 + 目录文件清单写入 DB。之后 `skills/` 目录与 DB 解耦——不挂 GitLab、不依赖磁盘、无 webhook。改数据 = 改 skill.json 重跑 `pnpm sync`。

---

## 2. 项目结构（pnpm monorepo）

```
skill-market/
├── pnpm-workspace.yaml
├── package.json                 # 根 scripts: dev/build/sync
├── docker-compose.yml
├── .env.example
├── SPEC.md                      # 本文档
├── skills/                      # 现有 25 个 skill 数据(导入源,不动)
├── packages/
│   └── shared/                  # 前后端共享 TS 类型
│       └── src/types/skill.ts
├── apps/
│   ├── api/                     # NestJS 后端
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── skills/          # 列表/详情 controller+service+dto
│   │   │   ├── categories/
│   │   │   ├── showcase/
│   │   │   ├── indexer/         # skill.json → DB 导入服务
│   │   │   └── prisma/          # PrismaService
│   │   ├── prisma/schema.prisma
│   │   └── Dockerfile
│   └── web/                     # React + Vite 前端
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── api/client.ts    # fetch 封装
│       │   ├── pages/{Home,SkillList,SkillDetail}.tsx
│       │   ├── components/      # SkillCard/FilterBar/SortDropdown/Badge
│       │   └── lib/
│       ├── nginx.conf
│       └── Dockerfile
└── SKILLS整理.md / 技能市场改进思路.md   # 保留
```

---

## 3. 数据模型（Prisma schema）

```prisma
model Skill {
  id            String   @id @default(cuid())
  slug          String   @unique          // = skill.json.name
  displayName   String                    // display_name
  description   String                    // description
  descriptionEn String?                   // description_en (部分有)
  summary       String?  @default("")     // 详情页摘要
  version       String                    // version
  icon          String                    // icon (emoji 或 url)
  category      String                    // category (6 类)
  runtimeType   String                    // runtime_type: gateway_migrated_api|external_api|local
  source        String   @default("official") // = owner.type
  ownerName     String                    // = owner.name
  ownerVerified Boolean  @default(true)   // = owner.verified
  readmePath    String   @default("SKILL.md")
  envVars       Json?                     // env_vars[]
  dependencies  Json?                     // dependencies[]
  api           Json?                     // api{base_url,auth_type,endpoints,...}
  migration     Json?                     // migration{migrated_from,to,behavior_change,status}
  platform      Json?
  tags          Json?
  examples      Json?                     // examples[] (部分 skill.json 有)
  hot           Boolean  @default(false)
  installCount  Int      @default(0)      // install_count
  stars         Int      @default(0)      // 用户行为(DB 独有,初始 0)
  score         Int      @default(0)      // 综合分(见 3.2)
  billing       String   @default("free") // 派生: local→free, api→paid
  readme        String   @default("")     // SKILL.md 正文(indexer 导入,DB 自包含)
  files         Json?                     // 目录文件清单[{path,size,type}](indexer 遍历生成)
  sha           String?                   // skill.json 内容 hash(重跑 sync 判断是否需更新)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  versions      SkillVersion[]

  @@index([category])
  @@index([runtimeType])
  @@index([billing])
  @@index([score(sort: Desc)])
}

model SkillVersion {
  id        String   @id @default(cuid())
  skill     Skill    @relation(fields: [skillId], references: [id])
  skillId   String
  version   String
  changelog Json     // {changes:[], type, date}
  date      DateTime
  createdAt DateTime @default(now())

  @@index([skillId])
}

model Category {
  key       String   @id              // image_video / document / ...
  name      String                    // 中文名
  nameEn    String
  sortOrder Int      @default(0)
  level     Int      @default(1)
  active    Boolean  @default(true)
}
```

### 3.1 billing 派生规则

对齐 `SKILLS整理.md` 计费分类:
- `runtime_type=local` → `free`(18 个)
- `runtime_type=gateway_migrated_api` 或 `external_api` → `paid`(7 个计费技能)

实现 `deriveBilling(runtimeType, api)` 工具,indexer 导入时计算。

### 3.2 score 计算规则(简化版)

基础分 = `installCount × 1 + stars × 5 + (migration.status === "verified" ? 100 : 0) + (hot ? 50 : 0)`

### 3.3 FTS5 虚拟表(raw migration)

```sql
CREATE VIRTUAL TABLE skills_fts USING fts5(
  slug, displayName, description, summary,
  content='Skill', content_rowid='id'
);
```

### 3.4 Category seed(6 类)

| key | name | nameEn | sortOrder |
|-----|------|--------|-----------|
| image_video | 图像视频 | Image & Video | 10 |
| document | 文档处理 | Document | 20 |
| code_debug | 代码调试 | Code & Debug | 30 |
| mail_communication | 邮件通信 | Mail & Communication | 40 |
| initialization | 初始化 | Initialization | 50 |
| system_config | 系统配置 | System Config | 60 |

---

## 4. API 设计

响应统一封装 `{code:0, data, message}`。

| 方法 | 路径 | 作用 |
|------|------|------|
| GET | `/api/skills` | 列表,query: `page,pageSize,sortBy,order,keyword,category,runtimeType,billing` |
| GET | `/api/v1/skills/:slug` | 详情,返回 `{skill, latestVersion, contentZhAvailable}` |
| GET | `/api/v1/categories` | 分类树 `{count, items}` |
| GET | `/api/v1/showcase/:type` | 首页榜单,`type=featured/top/hot/recommended` |
| GET | `/api/v1/skills/:slug/versions` | 版本历史 |

**sortBy 枚举**:`score`(默认) / `downloads` / `stars` / `rank` / `updated_at`

**列表响应**:`{code:0, data:{skills:[...], total, page, pageSize}}`

**详情响应**:`skill` 对象含上述全部字段(含 `readme` 正文、`files` 清单、`api`、`migration`、`envVars` 等);`latestVersion` 取 `versions` 最新一条;`contentZhAvailable` = `description` 非空。

---

## 5. 前端页面设计

### 5.1 全局布局
- **顶部导航仅两项**:首页 / 全部技能
- **无页脚快捷入口**:不建服务协议、隐私协议、建议反馈等跳转
- 配色:主色蓝 `#007AFF`、辅 `#0052D9`、中性灰 `#f5f5f5`/`#1c1c1e`
- 字体:`PingFang SC` + `Plus Jakarta Sans`
- 卡片圆角 12px、轻阴影 `0 4px 16px #0000001a`

### 5.2 首页 `/`
- Hero:标题 + 搜索框(搜索跳 `/skills?keyword=`)
- 榜单区:`/api/v1/showcase/top` 渲染 Top 技能横滑卡
- 分类入口:6 个 category 卡片,点击带 `category` 参数跳列表页
- 推荐精选:`showcase/featured`
- **不出现**任何「快捷入口」服务区

### 5.3 列表页 `/skills`(导航的「全部技能」)
- 排序下拉:`score`(默认) / `downloads` / `stars` / `rank` / `updated_at`
- 筛选 chip 组:
  - 运行方式:`本地运行` / `外网API` / `网关迁移`
  - 计费:`免费` / `计费`
- 卡片网格 `grid-cols-2`(桌面):icon + displayName + description + category 徽章 + runtime_type 徽章 + 计费徽章 + installCount
- 无限加载(pageSize + 加载更多)

### 5.4 详情页 `/skills/:slug`(两 Tab + 文件清单)

左侧主区,**仅两个 Tab**:
- **概述**:渲染 SKILL.md(`react-markdown`)
- **历史版本**:`/api/v1/skills/:slug/versions` 渲染 changelog 时间轴

> 不做 skillhub 的「效果预览」Tab、测评报告、安全验证(科恩/云鼎/内容指纹/数字签名/如何验证/使用说明)整个右侧安全区。

右侧基础信息卡:分类、运行方式、计费、版本、更新时间、安装数(仅展示元数据,无安装按钮、无价格区、无迁移验证区)。

**文件清单区**(替代原「安装区」):展示该技能目录的文件树(`skill.files` 字段),如 `SKILL.md / skill.json / scripts/*.py`,纯展示,不提供下载/clone。

---

## 6. Indexer 导入机制

`apps/api/src/indexer/indexer.service.ts`:
1. glob 扫描 `skills/*/skill.json`
2. 解析 JSON → 映射 Prisma 模型 → upsert(按 slug)
3. **读取并写入 SKILL.md 正文**到 `skill.readme`(DB 自包含)
4. **生成文件清单**:遍历技能目录(递归,跳过 `node_modules`/`.git`),记录 `{path, size, type}` 写入 `skill.files`
5. 同步 `SkillVersion`(changelog 数组)
6. `deriveBilling()` 计算 billing
7. 重建 FTS5 索引
8. 记录 `sha`(skill.json 内容 hash),重跑时未变化则跳过该 skill

触发方式:
- CLI:`pnpm sync`(手动重导)
- 首次启动:NestJS `OnModuleInit` 检测 DB skill 表为空时自动跑一次全量

categories 由 seed 脚本初始化(见 3.4)。

---

## 7. 部署方案(Docker Compose,可移植)

`docker-compose.yml`:
```yaml
services:
  api:
    build: ./apps/api
    environment:
      - DATABASE_URL=file:/app/data/skill-market.db
      - SKILLS_DIR=/app/skills
    volumes:
      - ./skills:/app/skills:ro    # 导入源(首次导入后可去掉)
      - ./data:/app/data           # SQLite 持久化
    ports: ["3001:3001"]
  web:
    build: ./apps/web
    ports: ["8080:80"]
    depends_on: [api]
```

`apps/web/nginx.conf`:静态托管 `dist/` + `location /api { proxy_pass http://api:3001; }`。

**可移植性保证**:
- 零云厂商依赖(无 EdgeOne/CDN/OSS/GitLab)
- SQLite 单文件随 `data/` 目录迁移
- 换服务器:`scp` 项目 + `docker compose up -d`(DB 已含全部数据)
- 切 Postgres:改 `.env` 的 `DATABASE_URL` + `pnpm prisma migrate deploy`
- 端口/路径全走 `.env`,不硬编码

---

## 8. 分阶段实施

| 阶段 | 目标 | 产出 | 验证 |
|------|------|------|------|
| **M0 脚手架** | monorepo 骨架 | pnpm workspace、apps/api+web 空壳、Dockerfile、docker-compose、.env | `pnpm dev` 前后端能起 |
| **M1 数据层** | 数据进库 | Prisma schema、indexer.service、seed categories、`pnpm sync` | `sync` 后 DB 有 25 条 skill,readme/files 有值,FTS 能搜 |
| **M2 后端 API** | 列表/详情/分类/榜单 | skills/categories/showcase controller + FTS5 搜索 | curl 各接口返回正确 `{code:0,data}` |
| **M3 前端** | 两页+详情通 | Home/SkillList/SkillDetail(两 Tab)+ 组件 + 布局 | 排序筛选生效、详情渲染 SKILL.md、文件清单显示 |
| **M4 部署** | 一键起 | docker-compose 跑通、nginx 反代 | `docker compose up` 后 8080 全功能可用 |

执行顺序:M0→M1→M2→M3→M4,每阶段验证通过再进下一阶段。

---

## 9. 验证方案

1. **M1**:`pnpm sync` → `pnpm prisma studio` 看到 25 条 skill;`readme` 非空;`files` 为清单数组;`billing` = 18 free + 7 paid
2. **M2**:`curl 'localhost:3001/api/skills?sortBy=score&pageSize=2'` 返回 `{code:0,data:{skills:[...],total:25}}`;`curl localhost:3001/api/v1/skills/comfyui-image-generation` 返回含 readme/files
3. **M3**:列表页 sortBy=downloads 排序变化;筛选「网关迁移」剩 5 个;详情页概述 Tab 渲染 SKILL.md、历史版本 Tab 显示 changelog、文件清单显示技能目录文件
4. **M4**:`docker compose up -d` → 浏览器 `localhost:8080` 全功能可用;导航仅「首页/全部技能」;首页无快捷入口区;停服删容器重启数据仍在
