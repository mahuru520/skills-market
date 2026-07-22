#!/bin/sh
# get-output-dir.sh — 供其他技能调用的输出目录读取器
#
# 生成/下载文件时,保存路径从本脚本获取,而非自行写死。
# 输出仅一行路径(便于 OUT=$(bash get-output-dir.sh) 捕获),并确保目录存在。
#
# 优先级:
#   1. 环境变量 OPENCLAW_OUTPUT_DIR (允许临时覆盖)
#   2. 工作目录下 TOOLS.md 中记录的"输出目录"
#   3. 回退到 detect-dirs.sh 探测的结果
#   4. 全部失败 → stderr 提示先运行 user-initialization,exit 1
#
# 用法:
#   OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh)
#   bash get-output-dir.sh          # 打印路径
#   bash get-output-dir.sh --mkdir  # 打印路径并 mkdir -p

set -u

HERE=$(cd "$(dirname "$0")" && pwd)
HOME="${HOME:-/root}"

# 从 TOOLS.md 提取指定键的值(如"输出目录"、"用户数据目录")
# 用法: read_tools_value <TOOLS_MD_PATH> <键名>
read_tools_value() {
  _md="$1"
  _key="$2"
  [ -f "$_md" ] || return 1
  # 匹配 "- **<键名>**: <值>" 形式
  grep -E "^[[:space:]]*- \*\*${_key}\*\*[::]" "$_md" 2>/dev/null | head -1 \
    | sed -E "s/.*\*\*${_key}\*\*[::][[:space:]]*//" \
    | sed -E 's/[[:space:]]*$//' \
    | tr -d "\"'"
}

# 推断工作目录(复用 detect-dirs 的探测逻辑,但不依赖其已运行)
detect_workdir() {
  if [ -n "${OPENCLAW_WORKSPACE:-}" ]; then echo "$OPENCLAW_WORKSPACE"; return 0; fi
  for cfg in "$HOME/.openclaw/config.yaml" "$HOME/.openclaw/openclaw.yaml" "$HOME/.config/openclaw/config.yaml"; do
    if [ -f "$cfg" ]; then
      val=$(grep -E '^[[:space:]]*workspace:' "$cfg" 2>/dev/null | head -1 | sed -E 's/^[[:space:]]*workspace:[[:space:]]*//' | tr -d "\"'")
      if [ -n "$val" ]; then echo "$val"; return 0; fi
    fi
  done
  for cand in "/root/.openclaw/workspace" "/root/.openclaw/openclaw-workspace" "$HOME/.openclaw/workspace"; do
    if [ -d "$cand" ]; then echo "$cand"; return 0; fi
  done
  return 1
}

OUT=""

# 1. 环境变量优先
if [ -n "${OPENCLAW_OUTPUT_DIR:-}" ]; then
  OUT="$OPENCLAW_OUTPUT_DIR"
fi

# 2. 从 TOOLS.md 读取"输出目录"
if [ -z "$OUT" ]; then
  WORK_DIR=$(detect_workdir || true)
  if [ -n "$WORK_DIR" ]; then
    TOOLS_MD="$WORK_DIR/TOOLS.md"
    OUT=$(read_tools_value "$TOOLS_MD" "输出目录" || true)
    # 兼容旧版 TOOLS.md: 若无"输出目录"键,回退到"用户数据目录"
    if [ -z "$OUT" ]; then
      OUT=$(read_tools_value "$TOOLS_MD" "用户数据目录" || true)
    fi
  fi
fi

# 3. 回退到 detect-dirs.sh 探测
if [ -z "$OUT" ]; then
  DETECT=$(bash "$HERE/detect-dirs.sh" 2>/dev/null || true)
  OUT=$(echo "$DETECT" | grep -E '^OUTPUT_DIR=' | head -1 | sed -E 's/^OUTPUT_DIR=//')
  [ "$OUT" = "__NOT_FOUND__" ] && OUT=""
fi

# 4. 全失败
if [ -z "$OUT" ]; then
  echo "ERROR: 无法确定输出目录。请先运行 user-initialization 技能(或 bash detect-dirs.sh --write)初始化 TOOLS.md,或设置 OPENCLAW_OUTPUT_DIR 环境变量。" >&2
  exit 1
fi

# 确保(覆盖场景下的)目录存在
if [ "${1:-}" = "--mkdir" ]; then
  mkdir -p "$OUT" || { echo "ERROR: 无法创建输出目录 $OUT" >&2; exit 1; }
fi

echo "$OUT"
