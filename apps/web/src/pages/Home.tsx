import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { fetchSkills, fetchShowcase, fetchCategories } from "../api/skills";
import { SkillCard } from "../components/SkillCard";
import { InstallPromptBar } from "../components/InstallPromptBar";
import { CATEGORY_CODE } from "../lib/labels";

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

  const cats = catQ.data?.items ?? [];
  const recent = (topQ.data ?? []).slice(0, 6);

  // 分类计数:分类接口不含 count,从已返回技能列表统计(与列表页一致)
  const countsQ = useQuery({
    queryKey: ["home-skills"],
    queryFn: () => fetchSkills({ page: 1, pageSize: 200, sortBy: "score" }),
  });
  const catCounts: Record<string, number> = {};
  (countsQ.data?.skills ?? []).forEach((s) => {
    catCounts[s.category] = (catCounts[s.category] ?? 0) + 1;
  });

  return (
    <div>
      {/* ============ HERO(渐变舞台 + 三层光晕 + 玻璃面板) ============ */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#e8eeff_0%,#f6f0ff_45%,#e6fbf3_100%)]">
        {/* 光晕背景层 */}
        <div className="hero-glow animate-sun-breath w-[480px] h-[480px] -top-[180px] -left-[120px] bg-[#007aff]/25" />
        <div className="hero-glow animate-sun-drift w-[380px] h-[380px] top-[60px] right-[8%] bg-[#af52de]/15" />
        <div className="hero-glow animate-sun-drift-slow w-[300px] h-[300px] -bottom-[140px] left-[38%] bg-[#34c759]/15" />

        <div className="relative max-w-market mx-auto px-6 pt-[84px] pb-16 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-14 items-start">
          <div className="min-w-0 animate-fadeUp" style={{ animationDelay: "0.05s" }}>
            <p className="eyebrow-pill inline-block">MARKET · v1.0</p>
            <h1 className="font-heading font-semibold text-ink mt-[22px] text-[2.5rem] md:text-[4.2rem] leading-[1.06] tracking-[-0.025em]">
              Osprey Skills，
              <br />
              用<span className="text-brand">一句话</span>装进你的 AI 助手。
            </h1>
            <p className="font-sans text-ink-soft text-[1.15rem] leading-[1.6] mt-[22px] mb-[30px] max-w-[30em]">
              浏览与检索全部 Osprey Skills。粘贴一条提示词，AI 助手自动拉取并装载技能包 ——
              无需命令行，无需手动配置。
            </p>

            {/* 一键安装提示词 */}
            <InstallPromptBar />
          </div>

          {/* registry live 面板(玻璃) */}
          <aside
            className="glass-panel overflow-hidden order-first lg:order-none min-w-0 animate-glassReveal"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="flex items-center justify-between px-[14px] py-[11px] border-b border-line font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-[7px] w-[7px]">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-brand" />
                </span>
                registry · live
              </span>
              <span>recent installs</span>
            </div>
            <div className="py-1.5">
              {recent.length === 0 && (
                <div className="px-[14px] py-6 font-mono text-xs text-ink-mute">载入中…</div>
              )}
              {recent.map((s, i) => (
                <Link
                  key={s.slug}
                  to={`/skills/${s.slug}`}
                  className="grid grid-cols-[54px_1fr_auto_auto] gap-3 items-center px-[14px] py-[7px] font-mono text-[12.5px] border-b border-transparent last:border-none hover:bg-white/60 transition-colors"
                  style={{ animation: `regRise .5s ease-out ${0.05 + i * 0.06}s both` }}
                >
                  <span className="text-ink-mute">{timeLabel(i)}</span>
                  <span className="text-ink truncate">
                    <span className="text-brand mr-1.5">+</span>
                    {s.slug}
                  </span>
                  <span className="text-ink-mute">{s.version}</span>
                  <span className="text-ink-mute text-[11px] tracking-[0.06em]">
                    {CATEGORY_CODE[s.category] ?? "SYS"}
                  </span>
                </Link>
              ))}
            </div>
            <div className="px-[14px] py-[10px] border-t border-line font-mono text-[11px] text-ink-mute flex justify-between">
              <span>{topQ.data?.length ?? 0} skills indexed</span>
              <Link to="/skills" className="text-brand hover:underline">
                查看全部 →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ============ 搜索 ============ */}
      <section className="border-t border-line">
        <div className="max-w-market mx-auto px-6 py-12">
          <p className="eyebrow-pill inline-block mb-3">SEARCH · 检索</p>
          <h2 className="font-heading font-semibold text-[1.9rem] tracking-[-0.025em] text-ink">
            搜一个技能
          </h2>
          <form onSubmit={onSearch} className="flex items-center gap-2 mt-6">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索技能名称或描述…"
              className="glass-pill flex-1 px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-brand/40"
            />
            <button type="submit" className="btn-apple px-7 py-3 text-[15px]">
              搜索
            </button>
          </form>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="border-t border-line bg-[#f2f2f7]/60">
        <div className="max-w-market mx-auto px-6 py-14">
          <SectionHead eyebrow="PROCESS · 安装流程">
            <h2 className="font-heading font-semibold text-[1.9rem] tracking-[-0.025em] text-ink mt-3">
              三步装好一个技能
            </h2>
          </SectionHead>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Step n="01" nail="copy" title="复制提示词">
              在技能详情页选「一键安装」，复制它对应的安装提示词。
            </Step>
            <Step n="02" nail="paste" title="粘贴给 AI">
              在任意 AI 助手对话中粘贴，助手识别协议并发起拉取。
            </Step>
            <Step n="03" nail="ready" title="自动装载">
              技能包下载、解压、登记到本地，下次遇到对应场景优先调用。
            </Step>
          </div>
        </div>
      </section>

      {/* ============ CATEGORY INDEX ============ */}
      <section className="border-t border-line">
        <div className="max-w-market mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between gap-6 mb-7">
            <SectionHead eyebrow="INDEX · 分类">
              <h2 className="font-heading font-semibold text-[1.9rem] tracking-[-0.025em] text-ink mt-3">
                按类别检索
              </h2>
            </SectionHead>
            <Link
              to="/skills"
              className="btn-glass px-5 py-2 text-[13px] shrink-0"
            >
              全部技能 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {cats.map((c, i) => (
              <Link
                key={c.key}
                to={`/skills?category=${c.key}`}
                className="glass-card glass-card-hover group block p-5 animate-scaleIn"
                style={{ animationDelay: `${0.05 + i * 0.04}s` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-brand bg-brand-soft border border-[#b3d4ff] rounded-[6px] px-2 py-[3px]">
                    {CATEGORY_CODE[c.key] ?? c.key.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="font-mono text-sm text-ink-mute group-hover:text-brand transition-colors">→</span>
                </div>
                <h3 className="font-heading text-[1.15rem] text-ink font-semibold mt-4 tracking-tight">{c.name}</h3>
                <p className="font-mono text-[11.5px] text-ink-mute mt-0.5 tracking-wide">{c.nameEn}</p>
                <p className="font-mono text-[12px] text-ink-soft mt-3">
                  {catCounts[c.key] ?? 0} 个技能
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRENDING ============ */}
      <section className="border-t border-line bg-[#f2f2f7]/60">
        <div className="max-w-market mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between gap-6 mb-7">
            <SectionHead eyebrow="TRENDING · 本周">
              <h2 className="font-heading font-semibold text-[1.9rem] tracking-[-0.025em] text-ink mt-3">
                热门 Top
              </h2>
            </SectionHead>
            <Link to="/skills" className="btn-glass px-5 py-2 text-[13px] shrink-0">
              查看全部 →
            </Link>
          </div>
          <div className="glass-panel divide-y divide-line overflow-hidden">
            {(topQ.data ?? []).slice(0, 6).map((s, i) => (
              <Link
                key={s.slug}
                to={`/skills/${s.slug}`}
                className="grid grid-cols-[56px_42px_1fr_auto] md:grid-cols-[56px_42px_1fr_auto_110px] gap-[18px] items-center py-[18px] px-4 hover:bg-white/70 transition-colors"
              >
                <span
                  className={`font-mono text-2xl font-medium tracking-[-0.02em] ${
                    i === 0 ? "text-brand" : "text-ink-mute"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[1.7rem] leading-none">{s.icon || "📦"}</span>
                <span className="flex flex-col gap-[3px] min-w-0">
                  <span className="font-heading text-[1.12rem] text-ink font-semibold truncate tracking-tight">
                    {s.displayName}
                  </span>
                  <span className="font-mono text-[11.5px] text-ink-mute truncate">{s.slug}</span>
                </span>
                <span className="hidden md:flex gap-1.5 flex-wrap justify-end">
                  <SmallBadge>{categoryLabel(s.category)}</SmallBadge>
                  <SmallBadge paid={s.billing === "paid"}>
                    {s.billing === "paid" ? "计费" : "免费"}
                  </SmallBadge>
                </span>
                <span className="hidden md:block font-mono text-[12.5px] text-ink-soft text-right">
                  ⬇ {s.installCount}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED ============ */}
      <section className="border-t border-line">
        <div className="max-w-market mx-auto px-6 py-16 pb-20">
          <SectionHead eyebrow="FEATURED · 精选">
            <h2 className="font-heading font-semibold text-[1.9rem] tracking-[-0.025em] text-ink mt-3">
              推荐精选
            </h2>
          </SectionHead>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {(featuredQ.data ?? []).map((s) => (
              <SkillCard key={s.slug} skill={s} />
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes regRise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes regRise { from { opacity: 1; transform: none; } to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}

/* ---------- 子组件 ---------- */

function SectionHead({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow-pill inline-block">{eyebrow}</p>
      {children}
    </div>
  );
}

function Step({
  n,
  nail,
  title,
  children,
}: {
  n: string;
  nail: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between">
        <span className="w-8 h-8 rounded-full bg-brand-soft text-brand font-mono text-[13px] font-semibold inline-flex items-center justify-center border border-[#b3d4ff]">
          {n}
        </span>
        <span className="font-mono text-[11px] text-ink-mute">{nail}</span>
      </div>
      <h3 className="font-heading font-semibold text-[1.2rem] text-ink mt-4 mb-2 tracking-tight">{title}</h3>
      <p className="font-sans text-[0.95rem] text-ink-soft m-0 leading-relaxed max-w-[24em]">{children}</p>
    </div>
  );
}

function SmallBadge({
  children,
  paid = false,
}: {
  children: React.ReactNode;
  paid?: boolean;
}) {
  return (
    <span
      className={`font-mono text-[10.5px] tracking-[0.02em] px-2 py-[3px] rounded-[6px] border whitespace-nowrap ${
        paid
          ? "bg-brand-soft text-brand border-[#b3d4ff]"
          : "bg-white/60 text-ink-soft border-line"
      }`}
    >
      {children}
    </span>
  );
}

/* ---------- 工具 ---------- */

function timeLabel(i: number): string {
  // 仅作面板装饰,无真实时间源;从 09:41 起每行倒退几分钟
  const base = 9 * 60 + 41;
  const t = base - i * 4;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function categoryLabel(key: string): string {
  const map: Record<string, string> = {
    image_video: "图像视频",
    comfyui: "ComfyUI",
    document: "文档处理",
    code_debug: "代码调试",
    mail_communication: "邮件通信",
    initialization: "初始化",
    system_config: "系统配置",
    instruction_skill: "指令型技能",
  };
  return map[key] ?? key;
}
