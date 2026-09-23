import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchConnectors, fetchConnectorCategories } from "../api/connectors";
import type { ConnectorListItem, ConnectorAuthMethod } from "@skill-market/shared";

// 一页全量展示,不分页(与技能/专家列表一致)
const PAGE_SIZE = 200;

const AUTH_LABEL: Record<ConnectorAuthMethod, string> = {
  none: "免鉴权",
  env_key: "需要 API Key",
  oauth: "OAuth 授权",
};

export function ConnectorList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const authMethod = (searchParams.get("authMethod") as ConnectorAuthMethod) || "";

  const { data, isLoading } = useQuery({
    queryKey: ["connectors", { keyword, category, authMethod }],
    queryFn: () =>
      fetchConnectors({
        page: 1,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        category: category || undefined,
        authMethod: authMethod || undefined,
      }),
  });

  const catQ = useQuery({ queryKey: ["categories", "connector"], queryFn: fetchConnectorCategories });

  // 搜索框本地受控,提交(回车/失焦)时写入 URL;输入态不触发请求
  const [keywordInput, setKeywordInput] = useState(keyword);
  useEffect(() => setKeywordInput(keyword), [keyword]);
  const submitKeyword = () => {
    if (keywordInput.trim() !== keyword) update("keyword", keywordInput.trim());
  };

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const connectors = data?.connectors ?? [];
  const total = data?.total ?? 0;
  const catCount = catQ.data?.items.length ?? 0;
  const catCounts: Record<string, number> = {};
  connectors.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
  });
  const catName = (key: string) =>
    catQ.data?.items.find((c) => c.key === key)?.name ?? key;

  return (
    <div>
      {/* ============ HERO(光晕舞台) ============ */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#e6fbf3_0%,#e8eeff_50%,#f6f0ff_100%)]">
        <div className="hero-glow animate-sun-breath w-[400px] h-[400px] -top-[150px] left-[8%] bg-[#34c759]/20" />
        <div className="hero-glow animate-sun-drift w-[320px] h-[320px] -bottom-[120px] right-[6%] bg-[#007aff]/20" />

        <div className="relative max-w-market mx-auto px-6 pt-[64px] pb-12 animate-fadeUp">
          <p className="eyebrow-pill inline-block mb-5">CONNECTOR REGISTRY</p>
          <h1 className="font-heading font-semibold text-ink text-[2.85rem] md:text-[3.6rem] leading-[1.08] tracking-[-0.025em]">
            全部连接器
          </h1>
          <p className="font-sans text-ink-soft text-[1.1rem] leading-[1.6] mt-4 max-w-[34em]">
            为你的 Agent 接入外部能力 —— 共 {total} 个 MCP 连接器预设,复制配置模板即可安装。
          </p>

          {/* 搜索(玻璃胶囊) */}
          <div className="relative mt-7 max-w-[560px]">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onBlur={submitKeyword}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitKeyword();
              }}
              placeholder="搜索连接器名称或描述…"
              className="glass-pill w-full pl-9 pr-10 py-3 text-sm font-sans text-ink placeholder:text-ink-mute focus:outline-none focus:border-brand/40"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute text-sm">🔍</span>
            {keywordInput && (
              <button
                onClick={() => {
                  setKeywordInput("");
                  update("keyword", "");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink text-sm px-1"
                aria-label="清除"
              >
                ✕
              </button>
            )}
          </div>

          {/* 统计条 */}
          <div className="flex flex-wrap gap-x-12 gap-y-4 mt-9">
            <Stat n={total} l="连接器总数" />
            <Stat n={catCount} l="分类" />
            <Stat n={connectors.filter((c) => c.authMethod === "none").length} l="免鉴权" />
            <Stat n={connectors.filter((c) => c.authMethod === "env_key").length} l="需要 Key" />
          </div>
        </div>
      </section>

      {/* ============ 筛选区(玻璃面板) ============ */}
      <section className="max-w-market mx-auto px-6 py-6">
        <div className="glass-panel p-5 space-y-4 animate-glassReveal">
          <FilterRow label="分类">
            <Chip active={!category} onClick={() => update("category", "")}>
              全部
            </Chip>
            {catQ.data?.items.map((c) => (
              <Chip key={c.key} active={category === c.key} onClick={() => update("category", c.key)}>
                {c.name} {catCounts[c.key] ?? 0}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="鉴权">
            <Chip active={!authMethod} onClick={() => update("authMethod", "")}>
              全部
            </Chip>
            {(Object.keys(AUTH_LABEL) as ConnectorAuthMethod[]).map((m) => (
              <Chip key={m} active={authMethod === m} onClick={() => update("authMethod", m)}>
                {AUTH_LABEL[m]}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </section>

      {/* ============ 结果 ============ */}
      <section className="max-w-market mx-auto px-6 pb-16">
        <div className="font-mono text-xs text-ink-mute mb-4 tracking-wide">
          {isLoading ? "加载中…" : `共 ${total} 个连接器`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((c) => (
            <ConnectorCard key={c.slug} connector={c} catName={catName(c.category)} />
          ))}
        </div>

        {!isLoading && connectors.length === 0 && (
          <div className="text-center py-16 text-ink-mute font-sans">
            没有匹配的连接器,试试调整筛选条件。
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- 连接器卡片 ---------- */

function ConnectorCard({
  connector,
  catName,
}: {
  connector: ConnectorListItem;
  catName: string;
}) {
  return (
    <Link
      to={`/connectors/${connector.slug}`}
      className="glass-card glass-card-hover group block h-full p-6 font-sans"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none shrink-0">{connector.icon || "🔌"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-[19px] text-ink tracking-tight truncate">
              {connector.displayName}
            </h3>
          </div>
          <p className="text-[12px] text-ink-mute mt-1 font-mono">
            v{connector.version} · {catName}
          </p>
        </div>
      </div>

      <p className="text-sm text-ink-soft mt-3 line-clamp-2 font-sans leading-relaxed">
        {connector.description}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-[6px] border bg-sky-50/80 text-sky-700 border-sky-200/60">
          MCP
        </span>
        <span
          className={`font-mono text-[10.5px] px-2 py-0.5 rounded-[6px] border ${
            connector.authMethod === "none"
              ? "bg-white/60 text-ink-soft border-line"
              : "bg-brand-soft text-brand border-[#b3d4ff]"
          }`}
        >
          {AUTH_LABEL[connector.authMethod] ?? connector.authMethod}
        </span>
        <span className="font-mono text-xs text-ink-mute ml-auto">
          ⬇ {connector.installCount}
        </span>
      </div>
    </Link>
  );
}

/* ---------- 子组件 ---------- */

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div>
      <div className="font-heading font-semibold text-[1.9rem] leading-none text-brand tabular-nums tracking-tight">
        {n}
      </div>
      <div className="font-mono text-[10.5px] tracking-[0.14em] text-ink-mute mt-2">{l}</div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-mono text-xs text-ink-mute w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-sans text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        active
          ? "bg-brand text-white shadow-[0_2px_8px_rgba(0,122,255,0.4)]"
          : "bg-white/60 text-ink-soft border border-line hover:border-brand/40 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
