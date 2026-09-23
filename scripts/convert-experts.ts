// scripts/convert-experts.ts
// 一次性脚本:将 workbuddy-expert-market-content-60.md 转制为 experts/<id>/expert.json
// 源文档 60 条(50 专家 + 10 团队);决策点 3:首版只上 50 个单专家,团队型跳过。
// prompt 用文档里的重构版四块结构(expert_identity / expert_method / tool_policy / delivery)。
// 运行方式: npx tsx scripts/convert-experts.ts [--dry-run]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "D:/Project/workbuddy/workbuddy-expert-skills-connectors-research/workbuddy-expert-market-content-60.md";
const TARGET_ROOT = join(__dirname, "..", "experts");
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------
// 1. 专家分类推断(scenarios/description 关键词 → 分类 key)
//    与技能 6 类分表(Category.kind = expert),见决策点 4
// ---------------------------------------------------------------
const EXPERT_CATEGORIES: Array<{ key: string; name: string; nameEn: string; keywords: string[] }> = [
  {
    key: "dev_engineering",
    name: "开发工程",
    nameEn: "Development & Engineering",
    keywords: [
      "开发", "架构", "代码", "前端", "后端", "小程序", "嵌入式", "固件",
      "dev", "code", "coding", "frontend", "backend", "architect", "firmware",
      "embedded", "mobile", "webapp", "godot", "review",
    ],
  },
  {
    key: "content_marketing",
    name: "内容营销",
    nameEn: "Content & Marketing",
    keywords: [
      "内容", "创作", "文案", "公众号", "小红书", "抖音", "自媒体", "营销",
      "小说", "爽文", "长文", "写作", "视频", "热点", "content", "writer",
      "novel", "manuscript", "viral", "creator",
    ],
  },
  {
    key: "finance_investment",
    name: "金融投研",
    nameEn: "Finance & Investment",
    keywords: [
      "股票", "估值", "投资", "交易", "回测", "财报", "会计", "财务",
      "equity", "trading", "backtest", "finance", "accounting", "market research", "fsi",
    ],
  },
  {
    key: "legal_compliance",
    name: "法律合规",
    nameEn: "Legal & Compliance",
    keywords: ["法律", "合同", "诉讼", "合规", "legal", "contract", "litigation"],
  },
  {
    key: "business_office",
    name: "商业办公",
    nameEn: "Business & Office",
    keywords: [
      "产品", "项目", "招聘", "简历", "销售", "商业", "电商", "跨境",
      "ppt", "文档", "演示", "product", "project", "recruitment", "resume",
      "sales", "ecommerce", "document", "presentation", "operations",
    ],
  },
  {
    key: "research_analysis",
    name: "研究分析",
    nameEn: "Research & Analysis",
    keywords: ["研究", "分析", "数据", "调研", "research", "analytics", "data", "wiki"],
  },
  {
    key: "life_entertainment",
    name: "生活娱乐",
    nameEn: "Life & Entertainment",
    keywords: ["生活", "美食", "游戏设计", "占卜", "命理", "生活助手", "game designer", "fortune", "book", "meituan"],
  },
];

function inferCategory(scenarios: string, description: string): string {
  const text = `${scenarios} ${description}`.toLowerCase();
  for (const c of EXPERT_CATEGORIES) {
    if (c.keywords.some((k) => text.includes(k.toLowerCase()))) return c.key;
  }
  return "business_office";
}

// ---------------------------------------------------------------
// 2. 解析源文档(统一结构:市场字段表 + prompt 代码块 + 建议市场配置)
// ---------------------------------------------------------------
interface ParsedExpert {
  id: string;
  name: string;
  type: string;
  priority: number;
  scenarios: string[];
  description: string;
  recommendedMode: string;
  prompt: string;
  skills: string;
  connectors: string;
}

function parseDoc(md: string): ParsedExpert[] {
  const out: ParsedExpert[] = [];
  // 按顶级条目标题分块(## 1. Senior Developer ... ## 60. ...)
  const blocks = md.split(/\n(?=## \d+\. )/);
  for (const block of blocks) {
    const idMatch = block.match(/\| id \| `([^`]+)` \|/);
    if (!idMatch) continue;
    const id = idMatch[1];
    const type = block.match(/\| type \| `(\w+)`/)?.[1] ?? "expert";
    const priority = Number(block.match(/\| priority \| (\d+) \|/)?.[1] ?? 0);
    const scenarios = (block.match(/\| scenarios \| (.+) \|/)?.[1] ?? "")
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const description = (block.match(/\| description \| (.+) \|/)?.[1] ?? "").trim();
    const recommendedMode = (block.match(/\| recommended mode \| (.+) \|/)?.[1] ?? "").trim();
    // prompt:第一个 ```text 代码块全文
    const promptMatch = block.match(/```text\n([\s\S]*?)```/);
    const prompt = promptMatch ? promptMatch[1].trim() : "";
    // 建议市场配置:推荐 Skills / 推荐 Connectors
    const skills = block.match(/^- 推荐 Skills：(.+)$/m)?.[1]?.trim() ?? "";
    const connectors = block.match(/^- 推荐 Connectors：(.+)$/m)?.[1]?.trim() ?? "";
    // 条目名:## 1. Senior Developer → Senior Developer
    const name = block.match(/^## \d+\. (.+)$/m)?.[1]?.trim() ?? id;
    out.push({ id, name, type, priority, scenarios, description, recommendedMode, prompt, skills, connectors });
  }
  return out;
}

// ---------------------------------------------------------------
// 3. 组装 expert.json(字段命名对齐 skill.json 蛇形风格)
// ---------------------------------------------------------------
function slugify(id: string): string {
  return id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function toExpertJson(e: ParsedExpert) {
  return {
    id: e.id,
    name: slugify(e.id), // Luca 用 local-expert:<name> 匹配已安装,语义对齐 skill 的 slug
    display_name: e.name,
    description: e.description,
    version: "1.0.0",
    icon: "🧠",
    category: inferCategory(e.scenarios.join(" "), e.description),
    type: e.type,
    priority: e.priority,
    invocation_mode: e.recommendedMode,
    owner: { name: "osprey", type: "official", verified: true },
    prompt: e.prompt,
    quickstart: {
      overview: e.description,
      scenarios: e.scenarios,
      example: e.scenarios[0] ?? "",
      notes: `推荐调用模式:${e.recommendedMode}`,
    },
    skills: e.skills && e.skills !== "无"
      ? e.skills.split(/[;；]/).map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s, required: false }))
      : [],
    connectors: e.connectors && !/^(无|按需|对应平台)/.test(e.connectors)
      ? e.connectors.split(/[;；]/).map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s, required: false }))
      : [],
    install_count: 0,
    changelog: [
      { version: "1.0.0", date: "2026-09-23", changes: ["从 WorkBuddy 市场内容重构版转制"], type: "feature" },
    ],
    created_at: "2026-09-23T00:00:00Z",
    updated_at: "2026-09-23T00:00:00Z",
  };
}

// ---------------------------------------------------------------
// main
// ---------------------------------------------------------------
const md = readFileSync(SOURCE, "utf-8");
const parsed = parseDoc(md);
const singles = parsed.filter((e) => e.type === "expert");
const teams = parsed.filter((e) => e.type === "expert_team");

console.log(`parsed: ${parsed.length} total, ${singles.length} expert, ${teams.length} expert_team`);
if (!promptValid(singles)) process.exit(1);

for (const e of singles) {
  const json = toExpertJson(e);
  const dir = join(TARGET_ROOT, json.name);
  const out = JSON.stringify(json, null, 2) + "\n";
  if (DRY_RUN) {
    console.log(`[dry-run] ${json.name} (${json.category}, priority=${json.priority}, prompt=${json.prompt.length} chars)`);
  } else {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "expert.json"), out, "utf-8");
    console.log(`wrote ${dir}/expert.json`);
  }
}
console.log(`done: ${singles.length} expert dirs${teams.length ? `, skipped ${teams.length} expert_team (决策点 3)` : ""}`);

function promptValid(list: ParsedExpert[]): boolean {
  const bad = list.filter((e) => !e.prompt.includes("<expert_identity>") || !e.prompt.includes("<delivery>"));
  if (bad.length) {
    console.error("prompt missing four-block structure for:", bad.map((e) => e.id).join(", "));
    return false;
  }
  return true;
}
