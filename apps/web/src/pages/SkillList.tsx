import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchSkills, fetchCategories } from "../api/skills";
import { SkillCard } from "../components/SkillCard";
import { SORT_OPTIONS, RUNTIME_LABEL, SOURCE_LABEL, CATEGORY_LABEL } from "../lib/labels";
import type { SortBy, RuntimeType, Billing, Source } from "@skill-market/shared";

// 一页全量展示,不分页
const PAGE_SIZE = 200;

export function SkillList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sortBy = (searchParams.get("sortBy") as SortBy) || "score";
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const runtimeType = (searchParams.get("runtimeType") as RuntimeType) || "";
  const billing = (searchParams.get("billing") as Billing) || "";
  const source = (searchParams.get("source") as Source) || "";

  const { data, isLoading } = useQuery({
    queryKey: ["skills", { sortBy, keyword, category, runtimeType, billing, source }],
    queryFn: () =>
      fetchSkills({
        page: 1,
        pageSize: PAGE_SIZE,
        sortBy,
        keyword: keyword || undefined,
        category: category || undefined,
        runtimeType: runtimeType || undefined,
        billing: billing || undefined,
        source: source || undefined,
      }),
  });

  const catQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

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

  const skills = data?.skills ?? [];
  const total = data?.total ?? 0;
  const freeCount = skills.filter((s) => s.billing === "free").length;
  const paidCount = total - freeCount;
  const catCount = catQ.data?.items.length ?? 0;
  // 分类计数来自已返回的技能列表(分类接口本身不含 count)
  const catCounts: Record<string, number> = {};
  skills.forEach((s) => {
    catCounts[s.category] = (catCounts[s.category] ?? 0) + 1;
  });
  const catName = (key: string) =>
    catQ.data?.items.find((c) => c.key === key)?.name ?? key;

  // 当前已选筛选(用于汇总条)
  const active: { key: string; label: string; name: string }[] = [];
  if (keyword) active.push({ key: "keyword", label: "搜索", name: keyword });
  if (category) active.push({ key: "category", label: "分类", name: catName(category) });
  if (runtimeType)
    active.push({ key: "runtimeType", label: "运行", name: RUNTIME_LABEL[runtimeType] ?? runtimeType });
  if (billing)
    active.push({ key: "billing", label: "计费", name: billing === "free" ? "免费" : "计费" });
  if (source)
    active.push({ key: "source", label: "来源", name: SOURCE_LABEL[source] ?? source });

  const clearAll = () => setSearchParams(new URLSearchParams());

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="border-b border-line bg-canvas2/40">
        <div className="max-w-market mx-auto px-6 pt-[58px] pb-12">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand font-medium inline-flex items-center gap-2.5 mb-5">
            <span className="w-[5px] h-[5px] rounded-full bg-brand" />
            SKILL REGISTRY
          </p>
          <h1 className="font-serif font-medium text-ink text-[2.85rem] md:text-[3.6rem] leading-[1.04] tracking-[-0.02em]">
            全部技能
          </h1>
          <p className="font-serif text-ink-soft text-[1.1rem] leading-[1.6] mt-4 max-w-[34em]">
            为你的 Agent 装配能力 —— 共 {total} 个可安装技能，覆盖图像视频、文档处理、代码调试与系统配置。
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
              placeholder="搜索技能名称或描述…"
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
            <Stat n={total} l="技能总数" />
            <Stat n={catCount} l="分类" />
            <Stat n={freeCount} l="免费" />
            <Stat n={paidCount} l="计费" />
          </div>
        </div>
      </section>

      {/* ============ 筛选区 ============ */}
      <section className="max-w-market mx-auto px-6 py-6">
        <div className="bg-canvas2 rounded-card border border-line p-5 space-y-4">
          {/* 排序 + 已选筛选汇总 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-ink-mute">排序</span>
            <select
              value={sortBy}
              onChange={(e) => update("sortBy", e.target.value)}
              className="font-mono text-xs border border-line rounded-[4px] px-2 py-1 bg-canvas text-ink focus:outline-none focus:border-brand"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {active.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                <span className="font-mono text-xs text-ink-mute">已选</span>
                {active.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => update(f.key, "")}
                    className="font-mono text-xs px-2.5 py-1 rounded-full bg-brand-soft text-brand border border-[#BFD3CF] hover:border-brand transition-colors"
                  >
                    {f.label} · {f.name} ✕
                  </button>
                ))}
                <button
                  onClick={clearAll}
                  className="font-mono text-xs text-ink-mute underline underline-offset-2 hover:text-ink"
                >
                  清除全部
                </button>
              </div>
            )}
          </div>

          {/* 分类(带计数) */}
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

          <FilterRow label="运行方式">
            <Chip active={!runtimeType} onClick={() => update("runtimeType", "")}>
              全部
            </Chip>
            {(Object.keys(RUNTIME_LABEL) as RuntimeType[]).map((rt) => (
              <Chip key={rt} active={runtimeType === rt} onClick={() => update("runtimeType", rt)}>
                {RUNTIME_LABEL[rt]}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="计费">
            <Chip active={!billing} onClick={() => update("billing", "")}>
              全部
            </Chip>
            <Chip active={billing === "free"} onClick={() => update("billing", "free")}>
              免费
            </Chip>
            <Chip active={billing === "paid"} onClick={() => update("billing", "paid")}>
              计费
            </Chip>
          </FilterRow>

          <FilterRow label="来源">
            <Chip active={!source} onClick={() => update("source", "")}>
              全部
            </Chip>
            {(Object.keys(SOURCE_LABEL) as Source[]).map((src) => (
              <Chip key={src} active={source === src} onClick={() => update("source", src)}>
                {SOURCE_LABEL[src]}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </section>

      {/* ============ 结果 ============ */}
      <section className="max-w-market mx-auto px-6 pb-16">
        <div className="font-mono text-xs text-ink-mute mb-4 tracking-wide">
          {isLoading ? "加载中…" : `共 ${total} 个技能`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((s) => (
            <SkillCard key={s.slug} skill={s} />
          ))}
        </div>

        {!isLoading && skills.length === 0 && (
          <div className="text-center py-16 text-ink-mute font-serif">
            没有匹配的技能，试试调整筛选条件。
          </div>
        )}
      </section>
    </div>
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
