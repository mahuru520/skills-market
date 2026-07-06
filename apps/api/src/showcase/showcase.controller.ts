import { Controller, Get, Param } from "@nestjs/common";
import { ShowcaseService } from "./showcase.service";
import type { ApiResponse, SkillListItem } from "@skill-market/shared";

@Controller("v1/showcase")
export class ShowcaseController {
  constructor(private readonly service: ShowcaseService) {}

  @Get(":type")
  async list(
    @Param("type") type: string,
  ): Promise<ApiResponse<SkillListItem[]>> {
    const data = await this.service.getByType(type);
    return { code: 0, data, message: "ok" };
  }
}
