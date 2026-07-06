# 安装 comfyui-image-generation 到 OspreyClaw
$ErrorActionPreference = "Stop"
$skillName = "comfyui-image-generation"
$openclawSkillDir = if ($env:OPENCLAW_SKILL_DIR) { $env:OPENCLAW_SKILL_DIR } else { "$env:USERPROFILE\.openclaw\skills" }
$target = Join-Path $openclawSkillDir $skillName

Write-Host "==> 安装 $skillName 到 $target" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $target | Out-Null

Write-Host "`n✓ 安装完成。使用前请配置环境变量：`n" -ForegroundColor Green
Write-Host "  `$env:GW = 'https://ai.ospreyai.cn'"
Write-Host "  `$env:API_KEY = 'sk-xxx'        # 网关控制台申请`n"
Write-Host "技能已迁移至外网网关，需自行记录 prompt_id 用于查询任务。"
