// scripts/import-ecommerce-packs.mjs
// 一次性脚本：将 3 个电商技能仓库作为「整包技能」放入 skills/<repo>/，
// 每个整包生成一份 skill.json（description 摘自仓库 README）。
// 整包下载走现有 /v1/skills/:slug/download；包内单技能下载走 /v1/skills/:pack/download?path=skills/<name>。
// 运行方式: node scripts/import-ecommerce-packs.mjs [--dry-run]
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = join(import.meta.dirname, "..");
const TARGET = join(ROOT, "skills");
const CATEGORY = "ecommerce";
const TODAY = "2026-11-13";

// 每个整包的 skill.json 元数据（description 摘自各自 README 开头）
const PACKS = [
  {
    slug: "ecommerce-image-skills",
    icon: "🛒",
    display_name: "电商出图技能包 Ecommerce Image Skills",
    description:
      "电商出图 Agent 技能包（12 个子技能，GPT Image 2.5）：Amazon 白底主图、A+ 页面模块图、淘宝详情长图、小红书封面、大促海报、卖点信息图、尺寸规格图、多角度套图、模特试穿、生活场景图、批量换背景与全套 Listing 编排，覆盖 Amazon / 淘宝天猫 / Shopee / TikTok Shop / 小红书。整体下载后按 skills/<子技能>/SKILL.md 逐个触发。",
    repo: "https://github.com/xianyu110/ecommerce-image-skills",
    author: "xianyu110",
    readme: "README.md",
    skillsSubdir: "skills",
  },
  {
    slug: "ecommerce-skills",
    icon: "🏭",
    display_name: "电商视觉生产技能包 Ecommerce Skills (dLazy)",
    description:
      "电商视觉生产 Agent 技能包（26 个子技能，dLazy）：把拍商品图拆成可组合链路——平铺图上身、鞋包配饰穿戴、多单品融图、换模特换背景、裂变套图、详情页模块、投前 AI 图质检、平台合规校验、批量生图流水线、主图视频、UGC 口播、去水印等；确定性动作交给脚本（并发/重试/断点续跑/成本熔断），后端可切 dLazy / OpenAI / Gemini / fal / Replicate / 火山方舟，也内置 MCP server。",
    repo: "https://github.com/dlazy-ai/ecommerce-skills",
    author: "dlazy-ai",
    readme: "README.md",
    skillsSubdir: "skills",
  },
  {
    slug: "ecommerce-video-skills",
    icon: "🎬",
    display_name: "电商短视频技能包 Ecommerce Video Skills",
    description:
      "电商短视频 Agent 技能包（14 个子技能）：一张商品图 → 带配音、字幕、花字、BGM 的 9:16 带货视频。含 3 秒钩子脚本、卖点分镜表、爆款拆解复刻、多模型镜头提示词（Seedance / Kling / Veo / Runway 等）、edge-tts 免费配音、多语言本地化、ffmpeg 本地自动成片（无需 API key）、直播切片、开箱对比评测、平台规格导出、封面标题 A/B、MiniMax H3 文/图生视频（走 Osprey 网关）。",
    repo: "https://github.com/xianyu110/ecommerce-video-skills",
    author: "xianyu110",
    readme: "README.md",
    skillsSubdir: "skills",
  },
];

function scanFiles(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = full.slice(base.length + 1).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      out.push({ path: rel, size: 0, type: "dir" });
      out.push(...scanFiles(full, base));
    } else {
      out.push({ path: rel, size: statSync(full).size, type: "file" });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function listSubSkills(packDir, subdir) {
  const dir = join(packDir, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

for (const pack of PACKS) {
  const packDir = join(TARGET, pack.slug);
  if (!existsSync(packDir)) {
    console.error(`❌ ${pack.slug}: 目录不存在，请先放好仓库文件`);
    continue;
  }

  const subSkills = listSubSkills(packDir, pack.skillsSubdir);
  const isGateway = pack.slug === "ecommerce-video-skills";

  const skill = {
    id: `osprey/${pack.slug}`,
    name: pack.slug,
    display_name: pack.display_name,
    description: pack.description,
    version: "1.0.0",
    icon: pack.icon,
    category: CATEGORY,
    source: "osprey",
    runtime_type: "local",
    billing: "free",
    owner: {
      name: pack.author,
      type: "community",
      verified: false,
      avatar: "👤",
      url: pack.repo,
    },
    readme: pack.readme,
    files: scanFiles(packDir),
    env_vars: [],
    tags: subSkills,
    sub_skills: subSkills.map((name) => ({
      name,
      path: `${pack.skillsSubdir}/${name}`,
    })),
    hot: false,
    changelog: [
      {
        version: "1.0.0",
        date: TODAY,
        changes: [`从 Osprey 来源电商技能包整包导入（${pack.repo}）`],
        type: "MINOR",
      },
    ],
    created_at: `${TODAY}T00:00:00.000Z`,
    updated_at: `${TODAY}T00:00:00.000Z`,
  };

  const jsonPath = join(packDir, "skill.json");
  if (DRY_RUN) {
    console.log(`[DRY-RUN] ${pack.slug}: ${subSkills.length} 子技能 → ${jsonPath}`);
    continue;
  }
  writeFileSync(jsonPath, JSON.stringify(skill, null, 2) + "\n", "utf-8");
  console.log(`✅ ${pack.slug}: skill.json 写入完成（${subSkills.length} 子技能）`);
}
