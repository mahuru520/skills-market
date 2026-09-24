// 共享 TS 类型:连接器(Connector)DTO
// 字段对齐 connectors/*/connector.json 真实结构
import type { QuickstartData, EnvVar } from "./skill";

export type ConnectorKind = "mcp"; // 首版唯一;保留扩展位(oauth/remote)

export type ConnectorAuthMethod = "none" | "env_key" | "oauth";

// 连接器特有:可直接写入客户端 MCP 配置的结构化模板。
// ${VAR} 占位符指向 envVars 里声明的 key,由客户端合成最终配置。
export type ConnectorTransport = "stdio" | "sse" | "streamable-http";

export interface StdioInstallTemplate {
  transport: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface HttpInstallTemplate {
  transport: "sse" | "streamable-http";
  url: string;
  headers?: Record<string, string>;
  auth?: {
    method: ConnectorAuthMethod;
    env_var?: string;
    hint?: string;
  };
}

export type ConnectorInstallTemplate =
  | StdioInstallTemplate
  | HttpInstallTemplate;

// 列表页 connector(精简,不含 install_template)
export interface ConnectorListItem {
  slug: string;
  displayName: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  kind: ConnectorKind;
  authMethod: ConnectorAuthMethod;
  ownerName: string;
  installCount: number;
  score: number;
  updatedAt: string;
}

// 详情页 connector(完整)
export interface ConnectorDetail {
  slug: string;
  displayName: string;
  description: string;
  version: string;
  icon: string;
  category: string;
  kind: ConnectorKind;
  authMethod: ConnectorAuthMethod;
  ownerName: string;
  ownerVerified: boolean;
  installTemplate: ConnectorInstallTemplate;
  envVars?: EnvVar[];
  capabilitiesSummary?: string;
  tags?: string[];
  quickstart?: QuickstartData;
  /** 客户端首拉耗时提示(如 uvx 首次从 PyPI 下载依赖),安装 UI 展示 */
  runtimeHint?: string;
  installCount: number;
  score: number;
  createdAt: string;
  updatedAt: string;
}
