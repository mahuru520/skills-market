import { type ApiResponse } from "@skill-market/shared";

export const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiGet<T>(path: string): Promise<T> {
  // path 形如 "/skills" "/v1/skills/:slug"
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }
  const body = (await res.json()) as ApiResponse<T>;
  if (body.code !== 0) {
    throw new Error(body.message || `API code ${body.code}`);
  }
  return body.data;
}
