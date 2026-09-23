import { apiGet, apiPost } from "./client";
import type {
  ConnectorListItem,
  ConnectorDetail,
  ConnectorAuthMethod,
  CategoryList,
} from "@skill-market/shared";

export interface ConnectorPage {
  connectors: ConnectorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchConnectors(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  kind?: string;
  authMethod?: ConnectorAuthMethod;
}): Promise<ConnectorPage> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.category) q.set("category", params.category);
  if (params.kind) q.set("kind", params.kind);
  if (params.authMethod) q.set("authMethod", params.authMethod);
  return apiGet<ConnectorPage>(`/v1/connectors?${q.toString()}`);
}

export function fetchConnectorDetail(slug: string): Promise<ConnectorDetail> {
  return apiGet<ConnectorDetail>(`/v1/connectors/${encodeURIComponent(slug)}`);
}

export function reportConnectorInstall(slug: string): Promise<{ installCount: number }> {
  return apiPost<{ installCount: number }>(
    `/v1/connectors/${encodeURIComponent(slug)}/install`,
  );
}

export function fetchConnectorCategories(): Promise<CategoryList> {
  return apiGet<CategoryList>(`/v1/categories?kind=connector`);
}
