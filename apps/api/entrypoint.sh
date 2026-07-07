#!/bin/sh
set -e

# SQLite volume 首次为空,需先把 schema 推到数据库建表
# 后续启动 schema 已存在则 no-op,安全幂等
echo "[entrypoint] syncing db schema (prisma db push)..."
node node_modules/prisma/build/index.js db push \
  --schema=apps/api/prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss

echo "[entrypoint] starting api..."
exec node apps/api/dist/main.js
