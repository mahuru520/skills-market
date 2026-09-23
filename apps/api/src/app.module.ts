import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { SkillsModule } from "./skills/skills.module";
import { ExpertsModule } from "./experts/experts.module";
import { ConnectorsModule } from "./connectors/connectors.module";
import { CategoriesModule } from "./categories/categories.module";
import { ShowcaseModule } from "./showcase/showcase.module";
import { IndexerModule } from "./indexer/indexer.module";

@Module({
  imports: [
    PrismaModule,
    IndexerModule,
    SkillsModule,
    ExpertsModule,
    ConnectorsModule,
    CategoriesModule,
    ShowcaseModule,
  ],
})
export class AppModule {}
