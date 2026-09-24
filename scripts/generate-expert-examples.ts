// scripts/generate-expert-examples.ts
// 批量调用 LLM 为每个专家生成真实示例任务(example)与精炼概述(overview),回写 expert.json
// 运行方式: npx tsx scripts/generate-expert-examples.ts [--dry-run] [--start <slug>] [--force]
// 需要设置环境变量: LLM_API_KEY=sk-xxx
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

const EXPERTS_DIR = join(__dirname, "..", "experts");
const DRY_RUN = process.argv.includes("--dry-run");
const API_BASE = process.env.LLM_API_BASE || "https://open.ospreyai.cn/v1";
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "deepseek-v4-pro";
const DELAY_MS = 200;

// 支持断点续跑
const startFrom = process.argv.includes("--start")
  ? process.argv[process.argv.indexOf("--start") + 1]
  : null;
let started = !startFrom;

interface Quickstart {
  overview: string; // 精炼概述(区别于 description 原文)
  scenarios: string[]; // 适用场景(保留原值,LLM 只参考)
  example: string; // 用户口吻的具体示例任务
  notes: string; // 注意事项(保留原值)
}

// ---------------------------------------------------------------
// LLM 调用
// ---------------------------------------------------------------

/** 从 LLM 返回中提取 JSON:去除 markdown 代码块包裹,尝试截取首个 {...} */
function extractJson(text: string): string {
  let t = text.trim();
  // 去掉 ```json ... ``` 包裹
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) t = fenceMatch[1].trim();
  // 截取从 { 到最后一个 }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) t = t.slice(start, end + 1);
  return t;
}

async function callLLM(prompt: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `你是一个专家市场的内容编辑。阅读专家提示词后,用中文输出一个 JSON 对象,格式严格如下:
{
  "overview": "一句话概述这位专家解决什么问题(20字以内,不要复述 description,要有增量信息)",
  "example": "最典型的一个用户示例任务(一句话,用户口吻,包含具体对象/上下文,不是两字名词。例如'帮我把这个 PyTorch 训练脚本改成可部署到生产的推理服务',而不是'AI工程')"
}
只输出 JSON,不要 markdown 代码块,不要额外解释。`,
            },
            { role: "user", content: `分析以下专家:\n\n${prompt}` },
          ],
          temperature: 0.3,
          max_tokens: 400,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM API error ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const raw = data.choices[0].message.content;
      const json = extractJson(raw);

      // 验证是否为合法 JSON
      JSON.parse(json);
      return json;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`    [重试 ${attempt + 1}/${retries}] ${(err as Error).message.slice(0, 60)}`);
        await sleep(500);
      } else {
        throw err;
      }
    }
  }
  throw new Error("unreachable");
}

/** 判断 example 是否为低质量(就是场景名词本身,长度极短) */
function isLowQualityExample(example: string): boolean {
  return !example || example.trim().length < 8 || example.includes("。") === false && example.length < 12;
}

// ---------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------
async function main() {
  if (!API_KEY) {
    console.error("请设置环境变量 LLM_API_KEY=sk-xxx");
    console.error(
      "示例: LLM_API_KEY=sk-xxx npx tsx scripts/generate-expert-examples.ts",
    );
    process.exit(1);
  }

  const dirs = readdirSync(EXPERTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  console.log(`找到 ${dirs.length} 个专家目录`);
  console.log(`API: ${API_BASE} | Model: ${MODEL}`);
  if (DRY_RUN) console.log("[DRY RUN] 不会实际写入");
  console.log("---");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of dirs) {
    // 断点续跑
    if (!started) {
      if (slug === startFrom) started = true;
      else {
        console.log(`  [跳过] ${slug} (断点续跑)`);
        skipped++;
        continue;
      }
    }

    const jsonPath = join(EXPERTS_DIR, slug, "expert.json");
    if (!existsSync(jsonPath)) {
      console.log(`  [跳过] ${slug} (缺少 expert.json)`);
      skipped++;
      continue;
    }

    const expertJson = JSON.parse(readFileSync(jsonPath, "utf-8"));

    const qs = expertJson.quickstart as Quickstart | undefined;
    const force = process.argv.includes("--force");
    // 跳过条件:已有高质量 example 且非 --force
    if (qs?.example && !isLowQualityExample(qs.example) && !force) {
      console.log(`  [跳过] ${slug} (example 已合格)`);
      skipped++;
      continue;
    }

    try {
      // prompt 全文可能较长,截断到 2500 字符送 LLM
      const promptText = String(expertJson.prompt || "").slice(0, 2500);
      const input = [
        `专家名: ${expertJson.display_name}`,
        `描述: ${expertJson.description}`,
        `适用场景: ${(qs?.scenarios ?? []).join("、")}`,
        `提示词(截选):\n${promptText}`,
      ].join("\n");

      console.log(`  [生成] ${slug} ...`);
      const result = await callLLM(input);
      const parsed = JSON.parse(result.trim()) as {
        overview: string;
        example: string;
      };

      // 校验:example 必须是像样的句子
      if (!parsed.example || parsed.example.trim().length < 10) {
        throw new Error(`LLM 返回的 example 过短: ${parsed.example}`);
      }
      if (!isLowQualityExample(parsed.example) === false) {
        // 二次确认不是名词
        throw new Error(`LLM 返回的 example 仍像场景名词: ${parsed.example}`);
      }

      // 回写:example 必换,overview 只在 LLM 给出有效值时替换
      expertJson.quickstart = {
        overview: parsed.overview || expertJson.quickstart?.overview || expertJson.description,
        scenarios: qs?.scenarios ?? [],
        example: parsed.example,
        notes: qs?.notes ?? "",
      };
      expertJson.updated_at = new Date().toISOString().slice(0, 10) + "T00:00:00Z";

      if (!DRY_RUN) {
        writeFileSync(jsonPath, JSON.stringify(expertJson, null, 2) + "\n");
      }

      console.log(`    → ${parsed.example}`);
      updated++;

      // 延迟,避免限流
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  [失败] ${slug}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log("---");
  console.log(
    `完成: ${updated} 更新, ${skipped} 跳过, ${failed} 失败 (dryRun:${DRY_RUN ? "yes" : "no"})`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
