import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface SeedCategory {
  key: string;
  name: string;
  nameEn: string;
  sortOrder: number;
}

const SEED: SeedCategory[] = [
  { key: "image_video", name: "图像视频", nameEn: "Image & Video", sortOrder: 10 },
  { key: "document", name: "文档处理", nameEn: "Document", sortOrder: 20 },
  { key: "code_debug", name: "代码调试", nameEn: "Code & Debug", sortOrder: 30 },
  { key: "mail_communication", name: "邮件通信", nameEn: "Mail & Communication", sortOrder: 40 },
  { key: "initialization", name: "初始化", nameEn: "Initialization", sortOrder: 50 },
  { key: "system_config", name: "系统配置", nameEn: "System Config", sortOrder: 60 },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      this.logger.log("seeding categories...");
      await this.prisma.category.createMany({ data: SEED });
    }
  }

  async list() {
    const items = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return { count: items.length, items };
  }
}
