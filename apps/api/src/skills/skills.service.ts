import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Response } from "express";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import archiver from "archiver";
import { PrismaService } from "../prisma/prisma.service";
import type {
  SkillDetail,
  SkillListItem,
  Paginated,
  SortBy,
  Order,
  RuntimeType,
  Billing,
  Source,
  ChangelogEntry,
  EnvVar,
  Dependency,
  SkillApi,
  SkillMigration,
  SkillFile,
  QuickstartData,
} from "@skill-market/shared";

const SORT_FIELD: Record<SortBy, string> = {
  score: "score",
  downloads: "installCount",
  stars: "stars",
  rank: "score", // 近期飙升暂用 score
  updated_at: "updatedAt",
};

function parseJson<T>(raw: string | null | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page?: number;
    pageSize?: number;
    sortBy?: SortBy;
    order?: Order;
    keyword?: string;
    category?: string;
    runtimeType?: RuntimeType;
    billing?: Billing;
    source?: Source;
  }): Promise<Paginated<SkillListItem>> {
    const page = Math.max(1, params.page ?? 1);
    // 上限放开到 500,配合前端「全部技能一页全量展示」(当前 25 个技能)
    const pageSize = Math.min(500, Math.max(1, params.pageSize ?? 12));
    const sortBy = params.sortBy ?? "score";
    const order = params.order ?? "desc";
    const sortField = SORT_FIELD[sortBy] ?? "score";

    const where: Record<string, unknown> = {};
    if (params.category) where.category = params.category;
    if (params.runtimeType) where.runtimeType = params.runtimeType;
    if (params.billing) where.billing = params.billing;
    if (params.source) where.source = params.source;
    if (params.keyword) {
      const kw = params.keyword;
      where.OR = [
        { slug: { contains: kw } },
        { displayName: { contains: kw } },
        { description: { contains: kw } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.skill.count({ where }),
    ]);

    const skills: SkillListItem[] = rows.map((r) => ({
      slug: r.slug,
      displayName: r.displayName,
      description: r.description,
      descriptionEn: r.descriptionEn ?? undefined,
      version: r.version,
      icon: r.icon,
      category: r.category,
      runtimeType: r.runtimeType as RuntimeType,
      billing: r.billing as Billing,
      source: r.source as Source,
      ownerName: r.ownerName,
      hot: r.hot,
      installCount: r.installCount,
      stars: r.stars,
      score: r.score,
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { skills, total, page, pageSize };
  }

  async detail(slug: string): Promise<SkillDetail> {
    const r = await this.prisma.skill.findUnique({ where: { slug } });
    if (!r) throw new NotFoundException(`skill not found: ${slug}`);

    const versions = await this.prisma.skillVersion.findMany({
      where: { skillId: r.id },
      orderBy: { date: "desc" },
    });
    const latest = versions[0];
    const latestVersion = latest
      ? (parseJson<ChangelogEntry>(latest.changelog) ?? {
          version: latest.version,
          date: latest.date.toISOString(),
          changes: [],
          type: "",
        })
      : undefined;

    return {
      slug: r.slug,
      displayName: r.displayName,
      description: r.description,
      descriptionEn: r.descriptionEn ?? undefined,
      summary: r.summary ?? "",
      version: r.version,
      icon: r.icon,
      category: r.category,
      runtimeType: r.runtimeType as RuntimeType,
      source: r.source as Source,
      ownerName: r.ownerName,
      ownerVerified: r.ownerVerified,
      readmePath: r.readmePath,
      envVars: parseJson<EnvVar[]>(r.envVars),
      dependencies: parseJson<Dependency[]>(r.dependencies),
      api: parseJson<SkillApi>(r.api),
      migration: parseJson<SkillMigration>(r.migration),
      platform: parseJson(r.platform),
      tags: parseJson(r.tags),
      examples: parseJson<string[]>(r.examples),
      hot: r.hot,
      installCount: r.installCount,
      stars: r.stars,
      score: r.score,
      billing: r.billing as Billing,
      readme: r.readme,
      quickstart: parseJson<QuickstartData>(r.summary),
      files: parseJson<SkillFile[]>(r.files),
      sub_skills: parseJson<Array<{ name: string; path: string }>>(
        r.subSkills,
      ),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      latestVersion,
      contentZhAvailable: !!r.description,
    };
  }

  /**
   * 下载技能整目录 zip:installCount +1,流式返回 zip。
   * 用 GET 而非 POST,使前端 <a download> 能直接触发浏览器原生下载。
   * 可选 path 参数:下载技能目录下的某个子目录(如整包技能内的单个子技能,
   * /v1/skills/ecommerce-skills/download?path=skills/flat-lay),
   * 防目录穿越:resolve 后必须仍位于技能目录内。
   */
  async download(slug: string, res: Response, subPath?: string): Promise<void> {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (!skill) throw new NotFoundException(`skill not found: ${slug}`);

    const skillsDir = process.env.SKILLS_DIR ?? "";
    const dir = join(skillsDir, slug);
    if (!skillsDir || !existsSync(dir) || !statSync(dir).isDirectory()) {
      throw new NotFoundException(`skill directory not found: ${slug}`);
    }

    let targetDir = dir;
    let zipName = slug;
    if (subPath) {
      const resolved = join(dir, subPath);
      if (
        !resolved.startsWith(dir + sep) ||
        !existsSync(resolved) ||
        !statSync(resolved).isDirectory()
      ) {
        throw new NotFoundException(`sub path not found: ${subPath}`);
      }
      targetDir = resolved;
      // zip 名:取子路径最后一段,如 skills/flat-lay → flat-lay.zip
      zipName = subPath.split("/").filter(Boolean).pop() ?? slug;
    }

    // 原子自增下载数(不阻塞下载流程,失败仅日志)
    this.prisma.skill
      .update({ where: { slug }, data: { installCount: { increment: 1 } } })
      .catch(() => undefined);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(zipName)}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 5 } });
    await new Promise<void>((resolve, reject) => {
      archive.on("error", (err) => {
        res.destroy(err);
        reject(err);
      });
      archive.pipe(res);
      archive.directory(targetDir, false);
      archive.finalize().then(() => resolve());
    });
  }

  /**
   * 对标 skillhub.cn/install/:slug.md — 返回 SKILL.md 触发浏览器下载。
   * Content-Type: text/plain, Content-Disposition: attachment。
   * installCount +1。
   */
  async serveSkillMd(slug: string, res: Response): Promise<void> {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (!skill) throw new NotFoundException(`skill not found: ${slug}`);

    const skillsDir = process.env.SKILLS_DIR ?? "";
    const filePath = join(skillsDir, slug, "SKILL.md");
    if (!skillsDir || !existsSync(filePath)) {
      throw new NotFoundException(`SKILL.md not found for: ${slug}`);
    }

    // 原子自增下载数(不阻塞响应,失败仅日志)
    this.prisma.skill
      .update({ where: { slug }, data: { installCount: { increment: 1 } } })
      .catch(() => undefined);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment;filename="${encodeURIComponent(slug)}.md"`,
    );
    createReadStream(filePath).pipe(res);
  }

  /**
   * 技能目录内静态资源(README 里的相对路径图片等):
   * GET /v1/skills/:slug/assets/<path> — 只读,防目录穿越,MIME 白名单。
   */
  serveAsset(slug: string, assetPath: string, res: Response): void {
    const skillsDir = process.env.SKILLS_DIR ?? "";
    const root = resolve(skillsDir, slug);
    const target = resolve(root, assetPath);
    if (
      !skillsDir ||
      !target.startsWith(root + sep) ||
      !existsSync(target) ||
      !statSync(target).isFile()
    ) {
      throw new NotFoundException(`asset not found: ${slug}/${assetPath}`);
    }
    const MIME: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".md": "text/markdown; charset=utf-8",
      ".txt": "text/plain; charset=utf-8",
    };
    const mime = MIME[extname(target).toLowerCase()];
    if (!mime) throw new NotFoundException(`asset type not allowed: ${assetPath}`);
    res.setHeader("Content-Type", mime);
    createReadStream(target).pipe(res);
  }

  async versions(slug: string): Promise<ChangelogEntry[]> {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!skill) throw new NotFoundException(`skill not found: ${slug}`);
    const rows = await this.prisma.skillVersion.findMany({
      where: { skillId: skill.id },
      orderBy: { date: "desc" },
    });
    return rows
      .map(
        (v) =>
          parseJson<ChangelogEntry>(v.changelog) ?? {
            version: v.version,
            date: v.date.toISOString(),
            changes: [],
            type: "",
          },
      )
      .filter(Boolean) as ChangelogEntry[];
  }
}
