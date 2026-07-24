import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { fetchShowcase, fetchCategories } from "../api/skills";
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
  const totalSkills = cats.reduce((sum, c) => sum, 0); // 分类计数暂无,用占位
  const recent = (topQ.data ?? []).slice(0, 6);

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="border-b border-line">
        <div className="max-w-market mx-auto px-6 pt-[72px] pb-14 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-14 items-start">
          <div className="min-w-0">
            <Eyebrow>MARKET <span className="text-lineStrong">·</span> v1.0</Eyebrow>
            <h1 className="font-serif font-medium text-ink mt-[22px] text-[2.5rem] md:text-[4.3rem] leading-[1.04] tracking-[-0.018em]">
              Osprey Skills，
              <br />
              用<span className="text-brand font-medium">一句话</span>装进你的 AI 助手。
            </h1>
            <p className="font-serif text-ink-soft text-[1.18rem] leading-[1.55] mt-[22px] mb-[30px] max-w-[30em]">
              浏览与检索全部 Osprey Skills。粘贴一条提示词，AI 助手自动拉取并装载技能包 ——
              无需命令行，无需手动配置。
            </p>

            {/* 一键安装提示词 */}
            <InstallPromptBar />
          </div>

          {/* registry live 面板 */}
          <aside className="bg-canvas2 border border-line rounded-[6px] overflow-hidden order-first lg:order-none min-w-0">
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
                  className="grid grid-cols-[54px_1fr_auto_auto] gap-3 items-center px-[14px] py-[7px] font-mono text-[12.5px] border-b border-transparent last:border-none hover:bg-canvas"
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
      <section className="border-b border-line bg-canvas2/60">
        <div className="max-w-market mx-auto px-6 py-12">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand font-medium inline-flex items-center gap-2.5">
            <span className="w-[5px] h-[5px] rounded-full bg-brand" />
            SEARCH <span className="text-lineStrong">·</span> 检索
          </p>
          <h2 className="font-serif font-medium text-[1.9rem] tracking-[-0.01em] text-ink mt-2.5 mb-6">
            搜一个技能
          </h2>
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索技能名称或描述…"
              className="flex-1 px-4 py-3 rounded-card border border-line bg-canvas font-sans text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="font-mono text-sm px-7 py-3 rounded-card bg-brand text-[#F4F2EA] hover:bg-brand-dark transition-colors"
            >
              搜索
            </button>
          </form>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="border-b border-line">
        <div className="max-w-market mx-auto px-6 py-14">
          <SectionHead eyebrow="PROCESS · 安装流程">
            <h2 className="font-serif font-medium text-[1.9rem] tracking-[-0.01em] text-ink mt-2.5">
              三步装好一个技能
            </h2>
          </SectionHead>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-line">
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
      <section className="border-b border-line">
        <div className="max-w-market mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between gap-6 mb-7">
            <SectionHead eyebrow="INDEX · 分类">
              <h2 className="font-serif font-medium text-[1.9rem] tracking-[-0.01em] text-ink mt-2.5">
                按类别检索
              </h2>
            </SectionHead>
            <Link
              to="/skills"
              className="font-mono text-[13px] text-brand hover:underline shrink-0"
            >
              全部技能 →
            </Link>
          </div>
          <div className="border-t border-lineStrong">
            {cats.map((c) => (
              <Link
                key={c.key}
                to={`/skills?category=${c.key}`}
                className="grid grid-cols-[64px_1.2fr_1fr_90px_28px] md:grid-cols-[64px_1.2fr_1fr_90px_28px] gap-[18px] items-center py-[18px] px-1.5 border-b border-line hover:bg-canvas2 hover:pl-3.5 transition-all"
              >
                <span className="font-mono text-xs font-semibold tracking-[0.1em] text-brand bg-brand-soft border border-line rounded-[4px] py-[5px] text-center">
                  {CATEGORY_CODE[c.key] ?? c.key.slice(0, 3).toUpperCase()}
                </span>
                <span className="font-serif text-[1.18rem] text-ink font-medium">{c.name}</span>
                <span className="hidden md:block font-mono text-[12.5px] text-ink-mute tracking-wide">
                  {c.nameEn}
                </span>
                <span className="hidden md:block font-mono text-[12.5px] text-ink-soft text-right">
                  {/* 分类计数由后端决定,暂不展示数字 */}
                </span>
                <span className="font-mono text-sm text-ink-mute text-right">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRENDING ============ */}
      <section className="border-b border-line">
        <div className="max-w-market mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between gap-6 mb-7">
            <SectionHead eyebrow="TRENDING · 本周">
              <h2 className="font-serif font-medium text-[1.9rem] tracking-[-0.01em] text-ink mt-2.5">
                热门 Top
              </h2>
            </SectionHead>
            <Link to="/skills" className="font-mono text-[13px] text-brand hover:underline shrink-0">
              查看全部 →
            </Link>
          </div>
          <div className="border-t border-lineStrong">
            {(topQ.data ?? []).slice(0, 6).map((s, i) => (
              <Link
                key={s.slug}
                to={`/skills/${s.slug}`}
                className="grid grid-cols-[56px_42px_1fr_auto] md:grid-cols-[56px_42px_1fr_auto_110px] gap-[18px] items-center py-[18px] px-1.5 border-b border-line hover:bg-canvas2 transition-colors"
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
                  <span className="font-serif text-[1.12rem] text-ink font-medium truncate">
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
      <section>
        <div className="max-w-market mx-auto px-6 py-16 pb-20">
          <SectionHead eyebrow="FEATURED · 精选">
            <h2 className="font-serif font-medium text-[1.9rem] tracking-[-0.01em] text-ink mt-2.5">
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand font-medium inline-flex items-center gap-2.5">
      <span className="w-[5px] h-[5px] rounded-full bg-brand shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function SectionHead({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand font-medium inline-flex items-center gap-2.5">
        <span className="w-[5px] h-[5px] rounded-full bg-brand" />
        {eyebrow}
      </p>
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
    <div className="relative py-[26px] md:px-[26px] md:pt-[26px] md:pb-2 border-b md:border-b-0 md:border-r border-line last:border-r-0 last:border-b-0">
      <span className="font-mono text-xs text-brand tracking-[0.1em] font-medium">{n}</span>
      <span className="hidden md:block absolute top-[26px] right-[26px] font-mono text-[11px] text-ink-mute">
        {nail}
      </span>
      <h3 className="font-serif font-medium text-[1.25rem] text-ink mt-3.5 mb-2">{title}</h3>
      <p className="font-serif text-[0.98rem] text-ink-soft m-0 max-w-[24em]">{children}</p>
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
      className={`font-mono text-[10.5px] tracking-[0.02em] px-2 py-[3px] rounded-[3px] border whitespace-nowrap ${
        paid
          ? "bg-brand-soft text-brand border-[#BFD3CF]"
          : "bg-canvas text-ink-soft border-line"
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
  };
  return map[key] ?? key;
}
