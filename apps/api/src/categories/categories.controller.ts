import { Controller, Get } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import type { ApiResponse, CategoryList } from "@skill-market/shared";

@Controller("v1/categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  async list(): Promise<ApiResponse<CategoryList>> {
    const data = await this.service.list();
    return { code: 0, data, message: "ok" };
  }
}
