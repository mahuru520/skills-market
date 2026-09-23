import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface SeedCategory {
  key: string;
  name: string;
  nameEn: string;
  kind: string; // skill | expert | connector
  sortOrder: number;
}

const SEED: SeedCategory[] = [
  // ---- skill 分类(原有) ----
  { key: "comfyui", name: "ComfyUI", nameEn: "ComfyUI", kind: "skill", sortOrder: 15 },
  { key: "image_video", name: "图像视频", nameEn: "Image & Video", kind: "skill", sortOrder: 10 },
  { key: "document", name: "文档处理", nameEn: "Document", kind: "skill", sortOrder: 20 },
  { key: "code_debug", name: "代码调试", nameEn: "Code & Debug", kind: "skill", sortOrder: 30 },
  { key: "mail_communication", name: "邮件通信", nameEn: "Mail & Communication", kind: "skill", sortOrder: 40 },
  { key: "initialization", name: "初始化", nameEn: "Initialization", kind: "skill", sortOrder: 50 },
  { key: "system_config", name: "系统配置", nameEn: "System Config", kind: "skill", sortOrder: 60 },
  { key: "instruction_skill", name: "指令型技能", nameEn: "Instruction", kind: "skill", sortOrder: 65 },
  // ---- expert 分类(决策点 4:共表加 kind,7 类) ----
  { key: "dev_engineering", name: "开发工程", nameEn: "Development & Engineering", kind: "expert", sortOrder: 10 },
  { key: "content_marketing", name: "内容营销", nameEn: "Content & Marketing", kind: "expert", sortOrder: 20 },
  { key: "finance_investment", name: "金融投研", nameEn: "Finance & Investment", kind: "expert", sortOrder: 30 },
  { key: "legal_compliance", name: "法律合规", nameEn: "Legal & Compliance", kind: "expert", sortOrder: 40 },
  { key: "business_office", name: "商业办公", nameEn: "Business & Office", kind: "expert", sortOrder: 50 },
  { key: "research_analysis", name: "研究分析", nameEn: "Research & Analysis", kind: "expert", sortOrder: 60 },
  { key: "life_entertainment", name: "生活娱乐", nameEn: "Life & Entertainment", kind: "expert", sortOrder: 70 },
  // ---- connector 分类(首版 MCP 预设目录) ----
  { key: "filesystem", name: "文件系统", nameEn: "Filesystem", kind: "connector", sortOrder: 10 },
  { key: "web_search", name: "网页搜索", nameEn: "Web Search", kind: "connector", sortOrder: 20 },
  { key: "data_db", name: "数据与数据库", nameEn: "Data & Database", kind: "connector", sortOrder: 30 },
  { key: "dev_tools", name: "开发工具", nameEn: "Dev Tools", kind: "connector", sortOrder: 40 },
  { key: "productivity", name: "办公效率", nameEn: "Productivity", kind: "connector", sortOrder: 50 },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 幂等补齐:每次启动确保 SEED 中定义的分类都存在(新增分类如 comfyui 也能落库)
    // kind 默认 skill(兼容旧 key);迁移语句见下方案例
    for (const c of SEED) {
      await this.prisma.category.upsert({
        where: { key: c.key },
        create: { key: c.key, name: c.name, nameEn: c.nameEn, kind: c.kind, sortOrder: c.sortOrder },
        update: { name: c.name, nameEn: c.nameEn, kind: c.kind, sortOrder: c.sortOrder },
      });
    }
  }

  async list(kind?: string) {
    const items = await this.prisma.category.findMany({
      where: { active: true, kind: kind ?? "skill" },
      orderBy: { sortOrder: "asc" },
    });
    return { count: items.length, items };
  }
}
