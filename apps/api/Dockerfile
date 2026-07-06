FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /repo

# 拷贝 monorepo 清单(含 .npmrc hoist 配置)
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma ./apps/api/prisma

RUN pnpm install --frozen-lockfile=false

# 拷贝源码
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

WORKDIR /repo/apps/api
RUN pnpm prisma generate
RUN pnpm build

# 运行阶段
FROM node:20-bookworm-slim AS runner
# 装 openssl:Prisma 运行时靠它探测 OpenSSL 版本(否则默认 1.1.x 找不到 3.0.x 引擎)
# 同时拉入 libssl3(查询引擎 .so 加载依赖)。用阿里云镜像加速 apt(国内服务器)
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null; \
    sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list 2>/dev/null; \
    apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/skill-market.db
ENV SKILLS_DIR=/app/skills
COPY --from=base /repo /app
RUN mkdir -p /app/data
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
