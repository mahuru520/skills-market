import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  ConnectorDetail,
  ConnectorListItem,
  ConnectorAuthMethod,
  ConnectorInstallTemplate,
  QuickstartData,
  EnvVar,
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
export class ConnectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    category?: string;
    kind?: string;
    authMethod?: ConnectorAuthMethod;
  }): Promise<{
    connectors: ConnectorListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(500, Math.max(1, params.pageSize ?? 12));

    const where: Record<string, unknown> = {};
    if (params.category) where.category = params.category;
    if (params.kind) where.kind = params.kind;
    if (params.authMethod) where.authMethod = params.authMethod;
    if (params.keyword) {
      const kw = params.keyword;
      where.OR = [
        { slug: { contains: kw } },
        { displayName: { contains: kw } },
        { description: { contains: kw } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.connector.findMany({
        where,
        orderBy: [{ installCount: "desc" }, { slug: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.connector.count({ where }),
    ]);

    const connectors: ConnectorListItem[] = rows.map((r) => ({
      slug: r.slug,
      displayName: r.displayName,
      description: r.description,
      version: r.version,
      icon: r.icon,
      category: r.category,
      kind: r.kind as never,
      authMethod: r.authMethod as ConnectorAuthMethod,
      ownerName: r.ownerName,
      installCount: r.installCount,
      score: r.score,
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { connectors, total, page, pageSize };
  }

  async detail(slug: string): Promise<ConnectorDetail> {
    const r = await this.prisma.connector.findUnique({ where: { slug } });
    if (!r) throw new NotFoundException(`connector not found: ${slug}`);

    return {
      slug: r.slug,
      displayName: r.displayName,
      description: r.description,
      version: r.version,
      icon: r.icon,
      category: r.category,
      kind: r.kind as never,
      authMethod: r.authMethod as ConnectorAuthMethod,
      ownerName: r.ownerName,
      ownerVerified: r.ownerVerified,
      installTemplate: parseJson<ConnectorInstallTemplate>(r.installTemplate) as ConnectorInstallTemplate,
      envVars: parseJson<EnvVar[]>(r.envVars),
      capabilitiesSummary: r.capabilitiesSummary ?? undefined,
      tags: parseJson<string[]>(r.tags),
      quickstart: parseJson<QuickstartData>(r.quickstart),
      runtimeHint: r.runtimeHint ?? undefined,
      installCount: r.installCount,
      score: r.score,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  /**
   * 安装上报(决策点 5):连接器无 zip 下载,安装 = 客户端按 install_template
   * 合成 MCP 配置,完成时显式上报计数。
   */
  async reportInstall(slug: string): Promise<{ installCount: number }> {
    const r = await this.prisma.connector.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (!r) throw new NotFoundException(`connector not found: ${slug}`);
    const updated = await this.prisma.connector.update({
      where: { slug },
      data: { installCount: { increment: 1 } },
      select: { installCount: true },
    });
    return { installCount: updated.installCount };
  }
}
