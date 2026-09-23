import { apiGet, apiPost } from "./client";
import type {
  ExpertListItem,
  ExpertDetail,
  ExpertType,
  CategoryList,
} from "@skill-market/shared";

export interface ExpertPage {
  experts: ExpertListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchExperts(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  type?: ExpertType;
}): Promise<ExpertPage> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.category) q.set("category", params.category);
  if (params.type) q.set("type", params.type);
  return apiGet<ExpertPage>(`/v1/experts?${q.toString()}`);
}

export function fetchExpertDetail(slug: string): Promise<ExpertDetail> {
  return apiGet<ExpertDetail>(`/v1/experts/${encodeURIComponent(slug)}`);
}

export function reportExpertInstall(slug: string): Promise<{ installCount: number }> {
  return apiPost<{ installCount: number }>(
    `/v1/experts/${encodeURIComponent(slug)}/install`,
  );
}

export function fetchExpertCategories(): Promise<CategoryList> {
  return apiGet<CategoryList>(`/v1/categories?kind=expert`);
}
