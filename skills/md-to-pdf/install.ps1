# 安装 md-to-pdf 到 OspreyClaw
$ErrorActionPreference = "Stop"
$skillName = "md-to-pdf"
$openclawSkillDir = if ($env:OPENCLAW_SKILL_DIR) { $env:OPENCLAW_SKILL_DIR } else { "$env:USERPROFILE\.openclaw\skills" }
$target = Join-Path $openclawSkillDir $skillName

Write-Host "==> 安装 $skillName 到 $target" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $target | Out-Null

Write-Host "`n✓ 安装完成。本地运行类技能，需预装依赖：`n" -ForegroundColor Green
Write-Host "  pandoc >= 2.0"
Write-Host "  wkhtmltopdf >= 0.12"
Write-Host "  python >= 3.10`n"
Write-Host "详见 references/install.md。"
