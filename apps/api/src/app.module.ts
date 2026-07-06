import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SkillsModule } from "./skills/skills.module";
import { CategoriesModule } from "./categories/categories.module";
import { ShowcaseModule } from "./showcase/showcase.module";
import { IndexerModule } from "./indexer/indexer.module";

@Module({
  imports: [
    PrismaModule,
    IndexerModule,
    SkillsModule,
    CategoriesModule,
    ShowcaseModule,
  ],
})
export class AppModule {}
