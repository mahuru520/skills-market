import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSkills, fetchCategories } from "../api/skills";
import { SkillCard } from "../components/SkillCard";
import { SORT_OPTIONS, RUNTIME_LABEL } from "../lib/labels";
import type { SortBy, RuntimeType, Billing } from "@skill-market/shared";

const PAGE_SIZE = 12;

export function SkillList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const sortBy = (searchParams.get("sortBy") as SortBy) || "score";
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const runtimeType = (searchParams.get("runtimeType") as RuntimeType) || "";
  const billing = (searchParams.get("billing") as Billing) || "";

  // 切换筛选条件时重置页码
  useEffect(() => {
    setPage(1);
  }, [sortBy, keyword, category, runtimeType, billing]);

  const { data, isLoading } = useQuery({
    queryKey: ["skills", { page, sortBy, keyword, category, runtimeType, billing }],
    queryFn: () =>
      fetchSkills({
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        keyword: keyword || undefined,
        category: category || undefined,
        runtimeType: runtimeType || undefined,
        billing: billing || undefined,
      }),
  });

  const catQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const skills = data?.skills ?? [];
  const total = data?.total ?? 0;
  const hasMore = skills.length < total;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-ink mb-4">全部技能</h1>

      {/* 筛选区 */}
      <div className="bg-white rounded-card shadow-card p-4 mb-6 space-y-3">
        {/* 排序 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ink-mute">排序：</span>
          <select
            value={sortBy}
            onChange={(e) => update("sortBy", e.target.value)}
            className="text-sm border border-black/10 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-brand"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 运行方式筛选 */}
        <FilterRow label="运行方式">
          <Chip active={!runtimeType} onClick={() => update("runtimeType", "")}>
            全部
          </Chip>
          {(Object.keys(RUNTIME_LABEL) as RuntimeType[]).map((rt) => (
            <Chip
              key={rt}
              active={runtimeType === rt}
              onClick={() => update("runtimeType", rt)}
            >
              {RUNTIME_LABEL[rt]}
            </Chip>
          ))}
        </FilterRow>

        {/* 计费筛选 */}
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

        {/* 分类筛选 */}
        <FilterRow label="分类">
          <Chip active={!category} onClick={() => update("category", "")}>
            全部
          </Chip>
          {catQ.data?.items.map((c) => (
            <Chip
              key={c.key}
              active={category === c.key}
              onClick={() => update("category", c.key)}
            >
              {c.name}
            </Chip>
          ))}
        </FilterRow>
      </div>

      {/* 结果统计 */}
      <div className="text-sm text-ink-mute mb-4">
        {isLoading ? "加载中…" : `共 ${total} 个技能`}
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((s) => (
          <SkillCard key={s.slug} skill={s} />
        ))}
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-white border border-black/10 text-ink px-6 py-2 rounded-card hover:border-brand hover:text-brand transition-colors"
          >
            加载更多（{skills.length}/{total}）
          </button>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-ink-mute w-16 shrink-0">{label}：</span>
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
      className={`text-xs px-3 py-1 rounded-full transition-colors ${
        active
          ? "bg-brand text-white"
          : "bg-gray-100 text-ink-mute hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
