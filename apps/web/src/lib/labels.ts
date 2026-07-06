export const RUNTIME_LABEL: Record<string, string> = {
  local: "本地运行",
  external_api: "外网API",
  gateway_migrated_api: "网关迁移",
};

export const RUNTIME_COLOR: Record<string, string> = {
  local: "bg-gray-100 text-gray-700",
  external_api: "bg-blue-50 text-blue-700",
  gateway_migrated_api: "bg-purple-50 text-purple-700",
};

export const BILLING_LABEL: Record<string, string> = {
  free: "免费",
  paid: "计费",
};

export const BILLING_COLOR: Record<string, string> = {
  free: "bg-green-50 text-green-700",
  paid: "bg-amber-50 text-amber-700",
};

export const CATEGORY_LABEL: Record<string, string> = {
  image_video: "图像视频",
  document: "文档处理",
  code_debug: "代码调试",
  mail_communication: "邮件通信",
  initialization: "初始化",
  system_config: "系统配置",
};

export const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "score", label: "综合评分" },
  { value: "downloads", label: "下载量" },
  { value: "stars", label: "收藏数" },
  { value: "rank", label: "近期飙升" },
  { value: "updated_at", label: "最近更新" },
];
