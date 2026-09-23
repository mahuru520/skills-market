import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ExpertsService } from "./experts.service";
import type {
  ApiResponse,
  ExpertDetail,
  ExpertListItem,
  ExpertType,
} from "@skill-market/shared";

@Controller("v1/experts")
export class ExpertsController {
  constructor(private readonly service: ExpertsService) {}

  @Get()
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string,
    @Query("category") category?: string,
    @Query("type") type?: ExpertType,
  ): Promise<
    ApiResponse<{
      experts: ExpertListItem[];
      total: number;
      page: number;
      pageSize: number;
    }>
  > {
    const data = await this.service.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      keyword,
      category,
      type,
    });
    return { code: 0, data, message: "ok" };
  }

  // 方案 A:prompt 内嵌详情返回,客户端安装 = 拉详情 + 本地落盘
  @Get(":slug")
  async detail(@Param("slug") slug: string): Promise<ApiResponse<ExpertDetail>> {
    const data = await this.service.detail(slug);
    return { code: 0, data, message: "ok" };
  }

  // 安装上报(计数 +1)
  @Post(":slug/install")
  async install(
    @Param("slug") slug: string,
  ): Promise<ApiResponse<{ installCount: number }>> {
    const data = await this.service.reportInstall(slug);
    return { code: 0, data, message: "ok" };
  }
}
