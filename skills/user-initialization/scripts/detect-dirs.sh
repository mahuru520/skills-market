#!/bin/sh
# detect-dirs.sh — 探测 OpenClaw 用户目录、系统工作目录与输出目录
#
# 不同 OpenClaw 部署/变体目录布局不同,本脚本按优先级探测,而非假定固定路径:
#   1. 环境变量 (OPENCLAW_HOME / OPENCLAW_WORKSPACE / OPENCLAW_OUTPUT_DIR)
#   2. 配置文件 (~/.openclaw/config.yaml 等)
#   3. 文件系统探测 (常见候选路径,取第一个真实存在的)
#   4. 全部失败 → 输出 NEEDS_INPUT 提示,由 agent 询问用户
#
# 输出目录约定: 默认等于用户目录(USER_DIR),即生成的文件直接落在用户数据目录。
# 若设置了 OPENCLAW_OUTPUT_DIR 环境变量,则以其覆盖(允许临时指定别处)。
#
# 用法:
#   ./detect-dirs.sh            仅探测,输出键值对
#   ./detect-dirs.sh --write    探测成功后,将结果写入 <工作目录>/TOOLS.md
#
# 输出示例:
#   WORK_DIR=/root/.openclaw/workspace
#   USER_DIR=/data/file
#   OUTPUT_DIR=/data/file
#
# 设计原则:脚本只负责"探测",TOOLS.md 的写入是可选副作用。
# 探测结果由 agent 读取后,作为后续所有 skill 的单一事实源。

set -u

HOME="${HOME:-/root}"

# ---------- 工作目录探测 ----------
detect_workdir() {
  # 1. 环境变量
  if [ -n "${OPENCLAW_WORKSPACE:-}" ]; then
    echo "$OPENCLAW_WORKSPACE"
    return 0
  fi
  # 2. 配置文件
  for cfg in "$HOME/.openclaw/config.yaml" "$HOME/.openclaw/openclaw.yaml" "$HOME/.config/openclaw/config.yaml"; do
    if [ -f "$cfg" ]; then
      val=$(grep -E '^[[:space:]]*workspace:' "$cfg" 2>/dev/null | head -1 | sed -E 's/^[[:space:]]*workspace:[[:space:]]*//' | tr -d "\"'")
      if [ -n "$val" ]; then echo "$val"; return 0; fi
    fi
  done
  # 3. 文件系统探测
  for cand in "/root/.openclaw/workspace" "/root/.openclaw/openclaw-workspace" "$HOME/.openclaw/workspace"; do
    if [ -d "$cand" ]; then echo "$cand"; return 0; fi
  done
  return 1
}

# ---------- 用户目录探测 ----------
detect_userdir() {
  # 1. 环境变量
  if [ -n "${OPENCLAW_HOME:-}" ]; then
    echo "$OPENCLAW_HOME"
    return 0
  fi
  # 2. 配置文件
  for cfg in "$HOME/.openclaw/config.yaml" "$HOME/.openclaw/openclaw.yaml" "$HOME/.config/openclaw/config.yaml"; do
    if [ -f "$cfg" ]; then
      val=$(grep -E '^[[:space:]]*(home|user_dir|userdir):' "$cfg" 2>/dev/null | head -1 | sed -E 's/^[[:space:]]*(home|user_dir|userdir):[[:space:]]*//' | tr -d "\"'")
      if [ -n "$val" ]; then echo "$val"; return 0; fi
    fi
  done
  # 3. 文件系统探测
  for cand in "/data/file" "/root/.openclaw/filebrowser-workspace/srv/users/files" "/root" "$HOME/.openclaw/workspace"; do
    if [ -d "$cand" ]; then echo "$cand"; return 0; fi
  done
  return 1
}

# ---------- 主流程 ----------
WORK_DIR=$(detect_workdir || true)
USER_DIR=$(detect_userdir || true)

[ -z "$WORK_DIR" ] && WORK_DIR="__NOT_FOUND__"
[ -z "$USER_DIR" ] && USER_DIR="__NOT_FOUND__"

# 输出目录: 环境变量优先,否则等于用户目录
if [ -n "${OPENCLAW_OUTPUT_DIR:-}" ]; then
  OUTPUT_DIR="$OPENCLAW_OUTPUT_DIR"
elif [ "$USER_DIR" != "__NOT_FOUND__" ]; then
  OUTPUT_DIR="$USER_DIR"
else
  OUTPUT_DIR="__NOT_FOUND__"
fi

echo "WORK_DIR=$WORK_DIR"
echo "USER_DIR=$USER_DIR"
echo "OUTPUT_DIR=$OUTPUT_DIR"

WRITE_MODE=0
[ "${1:-}" = "--write" ] && WRITE_MODE=1

# 写入 TOOLS.md(仅当工作目录与用户目录都探测成功)
if [ "$WRITE_MODE" = "1" ]; then
  if [ "$WORK_DIR" = "__NOT_FOUND__" ] || [ "$USER_DIR" = "__NOT_FOUND__" ]; then
    echo ""
    echo "WRITE_SKIPPED: 目录未完全确定,无法写入 TOOLS.md"
  else
    TOOLS_MD="$WORK_DIR/TOOLS.md"
    TS=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "unknown")
    mkdir -p "$WORK_DIR"
    # 追加/更新"目录约定"区块:若已存在则先删除旧区块再写新的
    if [ -f "$TOOLS_MD" ]; then
      # 删除已有的自动探测区块(从标记行到下一个 ## 之前)
      awk '
        BEGIN{skip=0}
        /^## 目录约定（自动探测）/{skip=1; next}
        skip==1 && /^## /{skip=0}
        skip==0{print}
      ' "$TOOLS_MD" > "$TOOLS_MD.tmp" && mv "$TOOLS_MD.tmp" "$TOOLS_MD"
    fi
    cat >> "$TOOLS_MD" <<EOF

## 目录约定（自动探测）
- **用户数据目录**: $USER_DIR
- **系统工作目录**: $WORK_DIR
- **输出目录**: $OUTPUT_DIR
- **探测时间**: $TS
- **探测来源**: detect-dirs.sh (env > config > filesystem)
EOF
    echo ""
    echo "WRITE_OK: 已写入 $TOOLS_MD"
  fi
fi

# 人工兜底提示
if [ "$WORK_DIR" = "__NOT_FOUND__" ] || [ "$USER_DIR" = "__NOT_FOUND__" ]; then
  echo ""
  echo "NEEDS_INPUT: 自动探测未能完全确定目录,请询问用户:"
  [ "$WORK_DIR" = "__NOT_FOUND__" ] && echo "  - OpenClaw 工作目录(workspace)在哪?"
  [ "$USER_DIR" = "__NOT_FOUND__" ] && echo "  - 用户文件目录在哪?"
  exit 1
fi
