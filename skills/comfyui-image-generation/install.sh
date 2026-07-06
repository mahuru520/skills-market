#!/usr/bin/env bash
# 安装 comfyui-image-generation 到 OspreyClaw
set -e
SKILL_NAME="comfyui-image-generation"
OPENCLAW_SKILL_DIR="${OPENCLAW_SKILL_DIR:-$HOME/.openclaw/skills}"
TARGET="$OPENCLAW_SKILL_DIR/$SKILL_NAME"

echo "==> 安装 $SKILL_NAME 到 $TARGET"
mkdir -p "$TARGET"

# 提示配置环境变量
cat <<'EOF'

✓ 安装完成。使用前请配置环境变量：

  export GW=https://ai.ospreyai.cn
  export API_KEY=sk-xxx        # 网关控制台申请

技能已迁移至外网网关，需自行记录 prompt_id 用于查询任务。
EOF
