import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ConnectorsService } from "./connectors.service";
import type {
  ApiResponse,
  ConnectorDetail,
  ConnectorListItem,
  ConnectorAuthMethod,
} from "@skill-market/shared";

@Controller("v1/connectors")
export class ConnectorsController {
  constructor(private readonly service: ConnectorsService) {}

  @Get()
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string,
    @Query("category") category?: string,
    @Query("kind") kind?: string,
    @Query("authMethod") authMethod?: ConnectorAuthMethod,
  ): Promise<
    ApiResponse<{
      connectors: ConnectorListItem[];
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
      kind,
      authMethod,
    });
    return { code: 0, data, message: "ok" };
  }

  // 详情含 install_template,客户端按模板合成 MCP 配置
  @Get(":slug")
  async detail(@Param("slug") slug: string): Promise<ApiResponse<ConnectorDetail>> {
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
