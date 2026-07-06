// 独立 CLI 入口:pnpm sync —— 不启动 Nest,直接调 IndexerService.importAll()
import { PrismaClient } from "../../generated/prisma";
import { IndexerService } from "./indexer.service";

// IndexerService 依赖 PrismaService(Nest 注入),CLI 场景手动构造一个最小替身
class CliPrisma extends PrismaClient {}

async function main() {
  const prisma = new CliPrisma();
  await prisma.$connect();
  const svc = new IndexerService(prisma as unknown as never);
  const res = await svc.importAll();
  // eslint-disable-next-line no-console
  console.log("sync result:", res);
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
