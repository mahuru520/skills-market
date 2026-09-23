import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchExperts, fetchExpertCategories } from "../api/experts";
import type { ExpertListItem, ExpertType } from "@skill-market/shared";
import { Link } from "react-router-dom";

// 一页全量展示,不分页(与技能列表一致)
const PAGE_SIZE = 200;

export function ExpertList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const type = (searchParams.get("type") as ExpertType | null) || "";

  const { data, isLoading } = useQuery({
    queryKey: ["experts", { keyword, category, type }],
    queryFn: () =>
      fetchExperts({
        page: 1,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        category: category || undefined,
        type: type || undefined,
      }),
  });

  const catQ = useQuery({ queryKey: ["categories", "expert"], queryFn: fetchExpertCategories });

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

  const experts = data?.experts ?? [];
  const total = data?.total ?? 0;
  const catCount = catQ.data?.items.length ?? 0;
  // 分类计数来自已返回的列表(分类接口不含 count,与技能列表一致)
  const catCounts: Record<string, number> = {};
  experts.forEach((e) => {
    catCounts[e.category] = (catCounts[e.category] ?? 0) + 1;
  });
  const catName = (key: string) =>
    catQ.data?.items.find((c) => c.key === key)?.name ?? key;

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="border-b border-line bg-canvas2/40">
        <div className="max-w-market mx-auto px-6 pt-[58px] pb-12">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand font-medium inline-flex items-center gap-2.5 mb-5">
            <span className="w-[5px] h-[5px] rounded-full bg-brand" />
            EXPERT REGISTRY
          </p>
          <h1 className="font-serif font-medium text-ink text-[2.85rem] md:text-[3.6rem] leading-[1.04] tracking-[-0.02em]">
            全部专家
          </h1>
          <p className="font-serif text-ink-soft text-[1.1rem] leading-[1.6] mt-4 max-w-[34em]">
            为你的 Agent 配备领域专家 —— 共 {total} 个可安装专家,覆盖开发工程、内容营销、金融投研、法律合规等方向。
          </p>

          {/* 搜索 */}
          <div className="relative mt-7 max-w-[560px]">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onBlur={submitKeyword}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitKeyword();
              }}
              placeholder="搜索专家名称或描述…"
              className="w-full pl-9 pr-10 py-3 text-sm rounded-card border border-line bg-canvas2 font-sans text-ink placeholder:text-ink-mute focus:outline-none focus:border-brand"
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
            <Stat n={total} l="专家总数" />
            <Stat n={catCount} l="分类" />
            <Stat n={experts.filter((e) => e.type === "expert").length} l="单专家" />
            <Stat n={experts.filter((e) => e.type === "expert_team").length} l="专家团队" />
          </div>
        </div>
      </section>

      {/* ============ 筛选区 ============ */}
      <section className="max-w-market mx-auto px-6 py-6">
        <div className="bg-canvas2 rounded-card border border-line p-5 space-y-4">
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

          <FilterRow label="类型">
            <Chip active={!type} onClick={() => update("type", "")}>
              全部
            </Chip>
            <Chip active={type === "expert"} onClick={() => update("type", "expert")}>
              单专家
            </Chip>
            <Chip active={type === "expert_team"} onClick={() => update("type", "expert_team")}>
              专家团队
            </Chip>
          </FilterRow>
        </div>
      </section>

      {/* ============ 结果 ============ */}
      <section className="max-w-market mx-auto px-6 pb-16">
        <div className="font-mono text-xs text-ink-mute mb-4 tracking-wide">
          {isLoading ? "加载中…" : `共 ${total} 个专家 · 按推荐权重排序`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((e) => (
            <ExpertCard key={e.slug} expert={e} catName={catName(e.category)} />
          ))}
        </div>

        {!isLoading && experts.length === 0 && (
          <div className="text-center py-16 text-ink-mute font-serif">
            没有匹配的专家,试试调整筛选条件。
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- 专家卡片 ---------- */

function ExpertCard({
  expert,
  catName,
}: {
  expert: ExpertListItem;
  catName: string;
}) {
  return (
    <Link
      to={`/experts/${expert.slug}`}
      className="group block h-full bg-canvas2 rounded-card border border-line p-6 font-sans shadow-[0_1px_2px_rgba(27,29,28,0.05)] hover:border-lineStrong hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-12px_rgba(14,77,68,0.25)] transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none shrink-0">{expert.icon || "🧠"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-semibold text-[19px] text-ink truncate">
              {expert.displayName}
            </h3>
            {expert.type === "expert_team" && (
              <span className="font-mono text-[9.5px] tracking-[0.1em] bg-[#C4552F] text-[#F4F2EA] px-1.5 py-0.5 rounded-[3px] shrink-0">
                TEAM
              </span>
            )}
          </div>
          <p className="text-[12px] text-ink-mute mt-1 font-mono">
            v{expert.version} · {catName}
          </p>
        </div>
      </div>

      <p className="text-sm text-ink-soft mt-3 line-clamp-2 font-sans leading-relaxed">
        {expert.description}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-[3px] border bg-brand-soft text-brand border-[#BFD3CF]">
          EXPERT
        </span>
        <span className="font-mono text-xs text-ink-mute ml-auto">
          ⬇ {expert.installCount}
        </span>
      </div>
    </Link>
  );
}

/* ---------- 子组件 ---------- */

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div>
      <div className="font-serif font-medium text-[1.9rem] leading-none text-brand tabular-nums">
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
      className={`font-mono text-xs px-3 py-1 rounded-full transition-colors ${
        active
          ? "bg-brand text-[#F4F2EA]"
          : "bg-canvas text-ink-soft border border-line hover:border-brand/40"
      }`}
    >
      {children}
    </button>
  );
}
