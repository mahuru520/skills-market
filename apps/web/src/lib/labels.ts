export const RUNTIME_LABEL: Record<string, string> = {
  local: "本地",
  external_api: "外网API",
  gateway_migrated_api: "网关迁移",
  gateway_async_api: "网关异步",
};

export const RUNTIME_COLOR: Record<string, string> = {
  local: "bg-canvas text-ink-soft border-line",
  external_api: "bg-orange-50 text-amber-700 border-amber-100",
  gateway_migrated_api: "bg-brand-soft text-brand border-[#BFD3CF]",
  gateway_async_api: "bg-brand-soft text-brand border-[#BFD3CF]",
};

export const BILLING_LABEL: Record<string, string> = {
  free: "免费",
  paid: "计费",
};

export const BILLING_COLOR: Record<string, string> = {
  free: "bg-canvas text-ink-soft border-line",
  paid: "bg-brand-soft text-brand border-[#BFD3CF]",
};

export const SOURCE_LABEL: Record<string, string> = {
  clawhub: "ClawHub",
  osprey: "Osprey",
};

export const SOURCE_COLOR: Record<string, string> = {
  clawhub: "bg-sky-50 text-sky-700 border border-sky-100",
  osprey: "bg-violet-50 text-violet-700 border border-violet-100",
};

export const CATEGORY_LABEL: Record<string, string> = {
  image_video: "图像视频",
  comfyui: "ComfyUI",
  document: "文档处理",
  code_debug: "代码调试",
  mail_communication: "邮件通信",
  initialization: "初始化",
  system_config: "系统配置",
};

// 分类三字母代号,用作紧凑的结构标签(registry 面板、分类索引色块等)
export const CATEGORY_CODE: Record<string, string> = {
  image_video: "IMG",
  comfyui: "CFU",
  document: "DOC",
  code_debug: "COD",
  mail_communication: "MAL",
  initialization: "INI",
  system_config: "SYS",
  other: "SYS",
};

export const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "score", label: "综合评分" },
  { value: "downloads", label: "下载量" },
  { value: "stars", label: "收藏数" },
  { value: "rank", label: "近期飙升" },
  { value: "updated_at", label: "最近更新" },
];
