import { Controller, Get, Query } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import type { ApiResponse, CategoryList } from "@skill-market/shared";

@Controller("v1/categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  // ?kind=skill|expert|connector,默认 skill(对 Luca 现有调用向后兼容)
  @Get()
  async list(@Query("kind") kind?: string): Promise<ApiResponse<CategoryList>> {
    const data = await this.service.list(kind);
    return { code: 0, data, message: "ok" };
  }
}
