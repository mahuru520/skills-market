# md-to-pdf 安装指南

## 在线安装（推荐）

```bash
# 安装 pandoc
apt-get update
apt-get install -y pandoc

# 安装 wkhtmltopdf
apt-get install -y wkhtmltopdf

# 安装中文字体
apt-get install -y fonts-wqy-zenhei
fc-cache -f
```

## 离线安装

使用 skill 自带的离线安装包（`.deb` 未纳入仓库，需自行下载放到 `packages/` 目录）：

```bash
cd /path/to/skills/md-to-pdf
bash scripts/install_offline.sh
```

离线包需自行下载放到 `packages/` 目录：
- `packages/pandoc/pandoc-3.9-1-amd64.deb`
- `packages/wkhtmltopdf/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb`
- `packages/wkhtmltopdf/libssl1.1_1.1.1f-1ubuntu2_amd64.deb`

> `packages/` 目录已被 `.gitignore` 排除（约 50MB 二进制，不进仓库）。未放置 .deb 时，`install_offline.sh` 会提示缺包，请改用上面的在线安装。

## 依赖检查

```bash
bash scripts/check_env.sh
```

## 环境要求

- 操作系统：Debian 11/12 或兼容系统
- 权限：需要 root 或 sudo 安装系统包
