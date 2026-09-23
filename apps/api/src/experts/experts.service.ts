import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  ExpertDetail,
  ExpertListItem,
  QuickstartData,
  ExpertDependency,
  ExpertType,
} from "@skill-market/shared";

function parseJson<T>(raw: string | null | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

@Injectable()
export class ExpertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    category?: string;
    type?: ExpertType;
  }): Promise<{
    experts: ExpertListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(500, Math.max(1, params.pageSize ?? 12));

    const where: Record<string, unknown> = {};
    if (params.category) where.category = params.category;
    if (params.type) where.type = params.type;
    if (params.keyword) {
      const kw = params.keyword;
      where.OR = [
        { slug: { contains: kw } },
        { displayName: { contains: kw } },
        { description: { contains: kw } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.expert.findMany({
        where,
        orderBy: [{ priority: "desc" }, { slug: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expert.count({ where }),
    ]);

    const experts: ExpertListItem[] = rows.map((r) => ({
      slug: r.slug,
      displayName: r.displayName,
      description: r.description,
      version: r.version,
      icon: r.icon,
      category: r.category,
      type: r.type as ExpertType,
      ownerName: r.ownerName,
      priority: r.priority,
      installCount: r.installCount,
      score: r.score,
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { experts, total, page, pageSize };
  }

  async detail(slug: string): Promise<ExpertDetail> {
    const r = await this.prisma.expert.findUnique({ where: { slug } });
    if (!r) throw new NotFoundException(`expert not found: ${slug}`);

    return {
      slug: r.slug,
      displayName: r.displayName,
      description: r.description,
      version: r.version,
      icon: r.icon,
      category: r.category,
      type: r.type as ExpertType,
      ownerName: r.ownerName,
      ownerVerified: r.ownerVerified,
      priority: r.priority,
      prompt: r.prompt,
      quickstart: parseJson<QuickstartData>(r.quickstart),
      skills: parseJson<ExpertDependency[]>(r.skills),
      connectors: parseJson<ExpertDependency[]>(r.connectors),
      installCount: r.installCount,
      score: r.score,
      invocationMode: r.invocationMode ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  /**
   * 安装上报(决策点 5):专家无 zip 下载,方案 A 下安装 = 客户端拉详情后
   * 本地落盘,计数由客户端安装完成时显式上报。
   */
  async reportInstall(slug: string): Promise<{ installCount: number }> {
    const r = await this.prisma.expert.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (!r) throw new NotFoundException(`expert not found: ${slug}`);
    const updated = await this.prisma.expert.update({
      where: { slug },
      data: { installCount: { increment: 1 } },
      select: { installCount: true },
    });
    return { installCount: updated.installCount };
  }
}
