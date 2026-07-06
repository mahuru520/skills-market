import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { SkillsService } from "./skills.service";
import type {
  ApiResponse,
  SkillDetail,
  Paginated,
  SkillListItem,
  SortBy,
  Order,
  RuntimeType,
  Billing,
  ChangelogEntry,
} from "@skill-market/shared";

@Controller()
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  // 兼容 skillhub 风格的无版本前缀列表接口
  @Get("skills")
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sortBy") sortBy?: SortBy,
    @Query("order") order?: Order,
    @Query("keyword") keyword?: string,
    @Query("category") category?: string,
    @Query("runtimeType") runtimeType?: RuntimeType,
    @Query("billing") billing?: Billing,
  ): Promise<ApiResponse<Paginated<SkillListItem>>> {
    const data = await this.service.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      order,
      keyword,
      category,
      runtimeType,
      billing,
    });
    return { code: 0, data, message: "ok" };
  }

  @Get("v1/skills/:slug")
  async detail(
    @Param("slug") slug: string,
  ): Promise<ApiResponse<SkillDetail>> {
    try {
      const data = await this.service.detail(slug);
      return { code: 0, data, message: "ok" };
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw e;
    }
  }

  @Get("v1/skills/:slug/versions")
  async versions(
    @Param("slug") slug: string,
  ): Promise<ApiResponse<ChangelogEntry[]>> {
    const data = await this.service.versions(slug);
    return { code: 0, data, message: "ok" };
  }
}
