// scripts/import-ecommerce-packs.mjs
// 一次性脚本：将 skills/ 下三个电商技能包（ecommerce-image-skills / ecommerce-skills / ecommerce-video-skills）
// 拍平为 skills/<slug>/ + skill.json，全部标记 source=osprey、billing=free、category=ecommerce
// 运行方式: node scripts/import-ecommerce-packs.mjs [--dry-run]
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = join(import.meta.dirname, "..");
const TARGET = join(ROOT, "skills");

const PACKS = [
  {
    dir: "ecommerce-image-skills",
    readme: "SKILL.md",
    repo: "https://github.com/xianyu110/ecommerce-image-skills",
    author: "xianyu110",
    note: "从 Osprey 来源电商图像技能包导入（GitHub xianyu110/ecommerce-image-skills）",
    displayNames: null, // 从 h1 提取
  },
  {
    dir: "ecommerce-skills",
    readme: "skill.md",
    repo: "https://github.com/dlazy-ai/ecommerce-skills",
    author: "dlazy-ai",
    note: "从 Osprey 来源电商视觉技能包导入（GitHub dlazy-ai/ecommerce-skills）",
    displayNames: JSON.parse(readFileSync(join(ROOT, "skills/ecommerce-skills/scripts/skill-display-names.json"), "utf-8")).names,
  },
  {
    dir: "ecommerce-video-skills",
    readme: "SKILL.md",
    repo: "https://github.com/xianyu110/ecommerce-video-skills",
    author: "xianyu110",
    note: "从 Osprey 来源电商视频技能包导入（GitHub xianyu110/ecommerce-video-skills）",
    displayNames: null,
  },
];

const CATEGORY = "ecommerce";
const TODAY = "2026-11-13";

// slug -> emoji 图标
const ICONS = {
  // image pack
  "amazon-a-plus": "🧩",
  "amazon-white-background": "⬜",
  "batch-background-swap": "🖌️",
  "ecommerce-listing-suite": "🛒",
  "lifestyle-scene": "🏞️",
  "model-try-on": "👗",
  "multi-angle-set": "🔄",
  "sale-banner": "🏷️",
  "selling-point-infographic": "📊",
  "size-chart": "📏",
  "taobao-detail-long-image": "📜",
  "xiaohongshu-cover": "📕",
  // dlazy pack
  "batch-image": "📦",
  "brand-kit": "🎨",
  "clothing-detail": "🔍",
  "clothing-extraction": "✂️",
  "clothing-grass-planting": "🌱",
  "creative-scene": "✨",
  "cross-border-localize": "🌍",
  "detect-task": "🕵️",
  "fabric-on-body": "🧵",
  "fission-pattern": "🪄",
  "flat-lay": "👕",
  "image-fusion": "🖼️",
  "item-change-background": "🌄",
  "item-detail": "📝",
  "item-repair": "🛠️",
  "item-selling-point": "🎯",
  "listing-optimizer": "📈",
  "main-image-video": "🎥",
  "material-enhancement": "💎",
  "one-shot": "🔁",
  "platform-compliance": "✅",
  "product-video-ad": "📢",
  "remove-watermark": "🧽",
  "to-3d": "🧊",
  "ugc-testimonial": "🎤",
  "wear-everything": "👠",
  // video pack
  "ai-voiceover-edge-tts": "🗣️",
  "cover-title-ab": "📌",
  "ffmpeg-auto-assemble": "🎞️",
  "hook-3s-script": "🎣",
  "image-to-video-shots": "📸",
  "live-stream-clips": "📹",
  "minimax-h3-video": "🎬",
  "multi-model-shot-prompts": "🤖",
  "multilingual-dubbing": "🌐",
  "platform-spec-export": "📐",
  "selling-point-storyboard": "📋",
  "subtitles-and-text-effects": "💬",
  "unboxing-comparison-review": "🎁",
  "viral-remake": "🔥",
};

function parseFrontmatter(md) {
  const trimmed = md.trimStart();
  if (!trimmed.startsWith("---")) return { fm: {}, body: trimmed };
  const end = trimmed.indexOf("---", 3);
  const fmBlock = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 3).trimStart();
  const fm = {};
  for (const line of fmBlock.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return { fm, body };
}

function extractH1(body) {
  const m = body.match(/^#\s+(.+)/m);
  if (!m) return null;
  // 去掉开头的 emoji 与空白
  return m[1].trim().replace(/^[\p{Emoji_Presentation}\u{FE0F}\u{200D}\s]+/u, "").trim();
}

// 单文件复制（保留目录结构）
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "out") continue; // 空输出目录，跳过
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else cpSync(s, d);
  }
}

function scanFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "out") continue;
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

const imported = [];
const errors = [];

for (const pack of PACKS) {
  const packDir = join(TARGET, pack.dir);
  const subs = readdirSync(join(packDir, "skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const sub of subs) {
    const subDir = join(packDir, "skills", sub);
    const mdName = existsSync(join(subDir, "SKILL.md")) ? "SKILL.md" : "skill.md";
    const md = readFileSync(join(subDir, mdName), "utf-8");
    const { fm, body } = parseFrontmatter(md);
    const slug = fm.name || sub;
    const description = (fm.description || "").replace(/\s+/g, " ").trim();
    if (!description) {
      errors.push(`${slug}: 无 description`);
      continue;
    }
    if (existsSync(join(TARGET, slug)) && slug !== pack.dir) {
      errors.push(`${slug}: 目标已存在，跳过`);
      continue;
    }

    const displayName =
      (pack.displayNames && pack.displayNames[sub]) ||
      extractH1(body) ||
      slug.replace(/-/g, " ");

    const isGateway = slug === "minimax-h3-video";

    const skill = {
      id: `osprey/${slug}`,
      name: slug,
      display_name: displayName,
      description,
      version: fm.version || "1.0.0",
      icon: ICONS[slug] || "🛒",
      category: CATEGORY,
      source: "osprey",
      runtime_type: isGateway ? "gateway_async_api" : "local",
      billing: "free",
      owner: {
        name: pack.author,
        type: "community",
        verified: false,
        avatar: "👤",
        url: pack.repo,
      },
      readme: mdName,
      files: scanFiles(subDir),
      env_vars: isGateway
        ? [
            { key: "GW", description: "外网网关地址", required: true, source: "固定 https://open.ospreyai.cn", example: "https://open.ospreyai.cn" },
            { key: "API_KEY", description: "网关 new-api key", required: true, source: "网关控制台申请", example: "sk-xxx" },
          ]
        : [],
      api: isGateway
        ? {
            base_url: "https://open.ospreyai.cn",
            auth_type: "gateway",
            endpoints: [{ method: "POST", path: "/v2/video_generation", desc: "提交文/图生视频异步任务" }],
          }
        : null,
      hot: false,
      changelog: [{ version: fm.version || "1.0.0", date: TODAY, changes: [pack.note], type: "MINOR" }],
      created_at: `${TODAY}T00:00:00.000Z`,
      updated_at: `${TODAY}T00:00:00.000Z`,
    };

    if (DRY_RUN) {
      imported.push(slug);
      console.log(`[DRY-RUN] ${slug} → skills/${slug}/ (${displayName})`);
      continue;
    }

    const targetDir = join(TARGET, slug);
    copyDir(subDir, targetDir);
    writeFileSync(join(targetDir, "skill.json"), JSON.stringify(skill, null, 2) + "\n", "utf-8");
    imported.push(slug);
    console.log(`✅ ${slug} → skills/${slug}/ (${displayName})`);
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Done: ${imported.length} imported, ${errors.length} errors`);
errors.forEach((e) => console.log(`  ❌ ${e}`));
