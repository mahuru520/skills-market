import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { fetchShowcase, fetchCategories } from "../api/skills";
import { SkillCard } from "../components/SkillCard";

export function Home() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const topQ = useQuery({ queryKey: ["showcase", "top"], queryFn: () => fetchShowcase("top") });
  const featuredQ = useQuery({ queryKey: ["showcase", "featured"], queryFn: () => fetchShowcase("featured") });
  const catQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/skills?keyword=${encodeURIComponent(q)}` : "/skills");
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-canvas border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-brand">
            Osprey Skill Market
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-ink mt-4">
            Osprey 技能市场
          </h1>
          <p className="text-lg text-ink-soft mt-4">浏览、搜索、了解全部 Osprey Skills</p>
          <form onSubmit={onSearch} className="max-w-xl mx-auto mt-8 flex gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索技能名称或描述…"
              className="flex-1 px-4 py-3 rounded-card border border-line bg-surface focus:outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="bg-brand text-white px-7 py-3 rounded-card hover:bg-brand-dark transition-colors"
            >
              搜索
            </button>
          </form>
        </div>
      </section>

      {/* 分类入口 */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHeader eyebrow="CATEGORIES" title="分类" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {catQ.data?.items.map((c) => (
            <Link
              key={c.key}
              to={`/skills?category=${c.key}`}
              className="bg-surface rounded-card shadow-card p-5 text-center hover:shadow-cardHover hover:-translate-y-0.5 transition-all"
            >
              <div className="text-sm font-medium text-ink">{c.name}</div>
              <div className="text-xs text-ink-mute mt-1">{c.nameEn}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top 榜单 */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHeader
          eyebrow="TRENDING"
          title="热门 Top"
          action={<Link to="/skills" className="text-sm text-brand hover:underline">查看全部 →</Link>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {topQ.data?.slice(0, 4).map((s) => (
            <SkillCard key={s.slug} skill={s} />
          ))}
        </div>
      </section>

      {/* 推荐精选 */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader eyebrow="FEATURED" title="推荐精选" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {featuredQ.data?.map((s) => (
            <SkillCard key={s.slug} skill={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-brand">{eyebrow}</p>
        <h2 className="text-2xl font-bold text-ink tracking-tight mt-1">{title}</h2>
      </div>
      {action}
    </div>
  );
}
