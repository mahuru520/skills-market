#!/usr/bin/env bash
# 安装 md-to-pdf 到 OspreyClaw
set -e
SKILL_NAME="md-to-pdf"
OPENCLAW_SKILL_DIR="${OPENCLAW_SKILL_DIR:-$HOME/.openclaw/skills}"
TARGET="$OPENCLAW_SKILL_DIR/$SKILL_NAME"

echo "==> 安装 $SKILL_NAME 到 $TARGET"
mkdir -p "$TARGET"

cat <<'EOF'

✓ 安装完成。本地运行类技能，需预装依赖：

  pandoc >= 2.0
  wkhtmltopdf >= 0.12
  python >= 3.10

详见 references/install.md。
EOF
