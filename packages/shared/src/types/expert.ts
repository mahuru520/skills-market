// 共享 TS 类型:专家(Expert)DTO
// 字段对齐 experts/*/expert.json 真实结构;prompt 内嵌(决策点 1 方案 A)
import type { QuickstartData } from "./skill";

export type ExpertType = "expert" | "expert_team";

// 列表页 expert(精简,不含 prompt 正文)
export interface ExpertListItem {
  slug: string;
  displayName: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  type: ExpertType;
  ownerName: string;
  priority: number;
  installCount: number;
  score: number;
  updatedAt: string;
}

// 详情页 expert(完整,含内嵌 prompt)
export interface ExpertDetail {
  slug: string;
  displayName: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  type: ExpertType;
  ownerName: string;
  ownerVerified: boolean;
  priority: number;
  prompt: string;
  quickstart?: QuickstartData;
  skills?: ExpertDependency[];
  connectors?: ExpertDependency[];
  installCount: number;
  score: number;
  invocationMode?: string;
  createdAt: string;
  updatedAt: string;
}

// 依赖引用(指向 skill / connector 条目,支撑详情页「依赖状态」)
export interface ExpertDependency {
  name: string;
  required?: boolean;
  reason?: string;
}
