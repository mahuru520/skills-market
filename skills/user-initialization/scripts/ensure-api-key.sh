#!/bin/sh
# ensure-api-key.sh — OspreyAI 网关 api_key 的单一事实源
#
# 调用网关 https://open.ospreyai.cn 的技能,api_key 从本脚本获取。
# 自动处理:探测 → 验证 → 引导补全。返回非空即可用。
#
# 用法:
#   bash skills/user-initialization/scripts/ensure-api-key.sh          # 取 key(交互补全)
#   bash skills/user-initialization/scripts/ensure-api-key.sh --check  # 仅验证,不引导(返回状态码)
#
# 优先级:
#   1. 环境变量 OSPREY_API_KEY (临时覆盖,不落盘)
#   2. 工作目录下 SECRETS.md 的 "osprey_api_key" 字段
#
# 输出:
#   成功 → stdout 一行可用 key
#   需要/无效 → stdout 空,stderr 引导文案,exit 1

set -u

GW="https://open.ospreyai.cn"
HOME="${HOME:-/root}"
HERE=$(cd "$(dirname "$0")" && pwd)

# ---------- 拿工作目录(复用 detect-dirs 逻辑)----------
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

# ---------- 从 SECRETS.md 读 key ----------
read_secret() {
  _md="$1"
  [ -f "$_md" ] || return 1
  grep -E "^[[:space:]]*- \*\*osprey_api_key\*\*:" "$_md" 2>/dev/null | head -1 \
    | sed -E 's/.*\*\*osprey_api_key\*\*:[[:space:]]*//' \
    | sed -E 's/[[:space:]]*$//' | tr -d "\"'"
}

# ---------- 删除 SECRETS.md 中的 API Key 段(失效清理)----------
delete_secret() {
  _md="$1"
  [ -f "$_md" ] || return 0
  awk '
    BEGIN{skip=0}
    /^## API Key（自动写入）/{skip=1; next}
    skip==1 && /^## /{skip=0}
    skip==0{print}
  ' "$_md" > "$_md.tmp" && mv "$_md.tmp" "$_md"
}

# ---------- 验证 key:GET /v1/models ----------
# 返回 0=有效,1=无效,2=网络错误(不判定 key 失效)
verify_key() {
  _key="$1"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 \
    -H "Authorization: Bearer $_key" "$GW/v1/models" 2>/dev/null || echo "000")
  case "$code" in
    2*) return 0 ;;
    401|403) return 1 ;;
    *) return 2 ;;
  fi
}

# ---------- 写入 SECRETS.md ----------
write_secret() {
  _md="$1"; _key="$2"
  mkdir -p "$(dirname "$_md")"
  delete_secret "$_md"
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "unknown")
  cat >> "$_md" <<EOF

## API Key（自动写入）
- **osprey_api_key**: $_key
- **base_url**: $GW
- **verified_at**: $TS
- **来源**: ensure-api-key.sh
EOF
  chmod 600 "$_md" 2>/dev/null
}

# ---------- 引导文案 ----------
print_guide() {
  cat >&2 <<EOF
未检测到可用的 OspreyAI api_key。

1. 到 https://open.ospreyai.cn 注册/登录,获取 api_key
2. 把 key 粘贴给我,我会验证并保存(写入工作目录 SECRETS.md,权限 600)
3. 保存后重新执行本次操作
EOF
}

# ---------- 主流程 ----------
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

# 1. 环境变量优先
CANDIDATE="${OSPREY_API_KEY:-}"

# 2. SECRETS.md
if [ -z "$CANDIDATE" ]; then
  WORK_DIR=$(detect_workdir || true)
  if [ -n "$WORK_DIR" ]; then
    CANDIDATE=$(read_secret "$WORK_DIR/SECRETS.md" || true)
  fi
fi

# 3. 验证
if [ -n "$CANDIDATE" ]; then
  if verify_key "$CANDIDATE"; then
    echo "$CANDIDATE"
    exit 0
  else
    # key 存在但失效:清掉 SECRETS.md 里的旧记录(环境变量的不动)
    WORK_DIR=$(detect_workdir || true)
    [ -n "$WORK_DIR" ] && delete_secret "$WORK_DIR/SECRETS.md"
    echo "INVALID: api_key 失效" >&2
    [ "$CHECK_ONLY" = "0" ] && print_guide
    exit 1
  fi
fi

# 4. 无 key
if [ "$CHECK_ONLY" = "1" ]; then
  echo "MISSING: 未配置 api_key" >&2
  exit 1
fi
print_guide
exit 1
