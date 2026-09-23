import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchSkillDetail, fetchSkillVersions } from "../api/skills";
import { BASE } from "../api/client";
import { Badge } from "../components/SkillCard";
import {
  RUNTIME_LABEL,
  RUNTIME_COLOR,
  BILLING_LABEL,
  BILLING_COLOR,
  CATEGORY_LABEL,
  SOURCE_LABEL,
  SOURCE_COLOR,
} from "../lib/labels";
import { getManual } from "../lib/manuals";
import type { SkillFile, ChangelogEntry, QuickstartData } from "@skill-market/shared";

/* ================================================================ */
/*  主组件                                                           */
/* ================================================================ */

export function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<"overview" | "quickstart" | "versions" | "manual">("overview");
  const queryClient = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["skill", slug],
    queryFn: () => fetchSkillDetail(slug!),
    enabled: !!slug,
  });
  const versionsQ = useQuery({
    queryKey: ["skill", slug, "versions"],
    queryFn: () => fetchSkillVersions(slug!),
    enabled: !!slug && tab === "versions",
  });

  if (detailQ.isLoading) {
    return <div className="max-w-market mx-auto px-6 py-10 text-ink-mute font-mono text-sm">加载中…</div>;
  }
  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="max-w-market mx-auto px-6 py-10">
        <p className="text-ink-mute font-sans">技能不存在或加载失败。</p>
        <Link to="/skills" className="text-brand hover:underline mt-2 inline-block font-mono text-sm">
          ← 返回列表
        </Link>
      </div>
    );
  }

  const s = detailQ.data;

  return (
    <div className="max-w-market mx-auto px-6 py-8 animate-fadeUp">
      <Link to="/skills" className="font-mono text-sm text-ink-mute hover:text-ink transition-colors">
        ← 全部技能
      </Link>

      {/* 标题区 */}
      <div className="flex items-start gap-4 mt-4 mb-6">
        <span className="text-5xl leading-none">{s.icon || "📦"}</span>
        <div className="flex-1">
          <p className="eyebrow-pill inline-block mb-2.5">
            {CATEGORY_LABEL[s.category] ?? s.category}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">{s.displayName}</h1>
          <p className="text-ink-mute mt-1 font-sans">{s.description}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge className={RUNTIME_COLOR[s.runtimeType]}>
              {RUNTIME_LABEL[s.runtimeType] ?? s.runtimeType}
            </Badge>
            <Badge className={BILLING_COLOR[s.billing]}>
              {BILLING_LABEL[s.billing] ?? s.billing}
            </Badge>
            <Badge className="bg-white/60 text-ink-soft border-line">
              {CATEGORY_LABEL[s.category] ?? s.category}
            </Badge>
            {SOURCE_LABEL[s.source] && (
              <Badge className={SOURCE_COLOR[s.source]}>
                {SOURCE_LABEL[s.source]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
        {/* 左侧主区 */}
        <div className="min-w-0">
          <div className="border-b border-line flex gap-6 mb-6">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
              概述
            </TabButton>
            <TabButton active={tab === "quickstart"} onClick={() => setTab("quickstart")}>
              快速开始
            </TabButton>
            <TabButton active={tab === "versions"} onClick={() => setTab("versions")}>
              历史版本
            </TabButton>
            {getManual(s.slug) && (
              <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
                用户手册
              </TabButton>
            )}
          </div>

          {tab === "overview" ? (
            <OverviewTab readme={s.readme} />
          ) : tab === "quickstart" ? (
            <QuickStartTab
              quickstart={s.quickstart}
              displayName={s.displayName}
              description={s.description}
            />
          ) : tab === "manual" ? (
            <ManualTab slug={s.slug} />
          ) : (
            <VersionsTab
              versions={versionsQ.data ?? []}
              isLoading={versionsQ.isLoading}
            />
          )}
        </div>

        {/* 右侧基础信息卡 */}
        <aside className="space-y-6">
          <PromptCard slug={s.slug} />
          <DownloadCard slug={s.slug} onDownloaded={() => queryClient.invalidateQueries({ queryKey: ["skill", slug] })} />

          <div className="glass-panel p-5">
            <h3 className="font-heading font-semibold text-ink mb-3">基础信息</h3>
            <dl className="text-sm space-y-2 font-mono">
              <InfoRow label="分类" value={CATEGORY_LABEL[s.category] ?? s.category} />
              <InfoRow label="运行方式" value={RUNTIME_LABEL[s.runtimeType] ?? s.runtimeType} />
              <InfoRow label="计费" value={BILLING_LABEL[s.billing] ?? s.billing} />
              <InfoRow label="来源" value={SOURCE_LABEL[s.source] ?? s.ownerName} />
              <InfoRow label="版本" value={s.version} />
              <InfoRow
                label="更新时间"
                value={new Date(s.updatedAt).toLocaleDateString("zh-CN")}
              />
              <InfoRow label="安装数" value={String(s.installCount)} />
            </dl>
          </div>

          <FileList files={s.files} />
        </aside>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  子组件                                                           */
/* ================================================================ */

function TabButton({
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
      className={`pb-2 border-b-2 -mb-px transition-colors font-sans font-medium ${
        active
          ? "border-brand text-brand"
          : "border-transparent text-ink-mute hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="text-ink text-right">{value}</dd>
    </div>
  );
}

/* ---------- 排版样式 ---------- */

const PROSE = `
  max-w-none break-words text-[15px] leading-relaxed text-ink font-sans
  [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-ink [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-line
  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pl-3 [&_h2]:border-l-[3px] [&_h2]:border-brand
  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2
  [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-ink-soft [&_h4]:mt-5 [&_h4]:mb-2
  [&_p]:mb-4 [&_p]:text-ink
  [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:space-y-1.5
  [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:space-y-1.5
  [&_li]:text-ink [&_li]:pl-1
  [&_li::marker]:text-ink-mute
  [&_a]:text-brand [&_a]:underline [&_a]:decoration-brand/30 [&_a]:underline-offset-2 [&_a]:break-all hover:[&_a]:decoration-brand
  [&_strong]:text-ink [&_strong]:font-semibold
  [&_blockquote]:border-l-[3px] [&_blockquote]:border-brand/30 [&_blockquote]:bg-white/60 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-md [&_blockquote]:mb-4 [&_blockquote]:text-ink-soft
  [&_hr]:my-8 [&_hr]:border-line
  [&_pre]:overflow-x-auto [&_pre]:whitespace-pre [&_pre]:rounded-[14px] [&_pre]:bg-[#f2f2f7]/80 [&_pre]:backdrop-blur-xl [&_pre]:border [&_pre]:border-line [&_pre]:p-4 [&_pre]:mb-5 [&_pre]:text-sm [&_pre]:shadow-[inset_0_1px_#ffffff,0_2px_8px_rgba(0,0,0,0.04)]
  [&_pre_code]:text-ink [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm [&_pre_code]:font-mono
  [&_code]:rounded [&_code]:bg-white/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-brand [&_code]:font-mono [&_code]:break-all
  [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm [&_table]:mb-5
  [&_thead]:border-b-2 [&_thead]:border-lineStrong
  [&_th]:bg-white/50 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-ink-soft [&_th]:font-mono
  [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-ink [&_td]:border-b [&_td]:border-line
  [&_tbody_tr]:hover:bg-white/60
  [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4
`.replace(/\s+/g, " ").trim();

/* ---------- 概述 Tab ---------- */

function OverviewTab({ readme }: { readme?: string }) {
  return (
    <article className={PROSE}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {stripFrontMatter(readme || "（无说明文档）")}
      </ReactMarkdown>
    </article>
  );
}

/* ---------- 快速开始 Tab ---------- */

function QuickStartTab({
  quickstart,
  displayName,
  description,
}: {
  quickstart?: QuickstartData;
  displayName: string;
  description: string;
}) {
  if (!quickstart) {
    return (
      <div className="glass-panel p-8 text-center">
        <p className="text-ink-mute text-sm font-sans">
          该技能暂未生成快速开始摘要，
          <br />
          请切换到「概述」查看完整文档。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 概述 + 描述 */}
      <div className="glass-panel p-5">
        <h2 className="font-heading text-xl font-semibold text-ink mb-2 tracking-tight">{displayName}</h2>
        <p className="text-ink-soft text-sm leading-relaxed font-sans">{quickstart.overview}</p>
        <p className="text-ink-mute text-xs mt-2 font-mono">{description}</p>
      </div>

      {/* 适用场景 */}
      {quickstart.scenarios.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-white/50 border-b border-line">
            <span className="text-base">🎯</span>
            <h3 className="font-heading font-semibold text-ink text-sm">适用场景</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-1.5">
              {quickstart.scenarios.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px] text-ink leading-relaxed font-sans">
                  <span className="text-ink-mute mt-0.5 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 快速上手 */}
      <div className="glass-panel overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-white/50 border-b border-line">
          <span className="text-base">🚀</span>
          <h3 className="font-heading font-semibold text-ink text-sm">快速上手</h3>
        </div>
        <div className="p-5">
          <p className="text-[15px] text-ink leading-relaxed font-sans">{quickstart.example}</p>
        </div>
      </div>

      {/* 注意事项 */}
      {quickstart.notes && quickstart.notes !== "无" && (
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-white/50 border-b border-line">
            <span className="text-base">⚠️</span>
            <h3 className="font-heading font-semibold text-ink text-sm">注意事项</h3>
          </div>
          <div className="p-5">
            <p className="text-[15px] text-ink leading-relaxed font-sans">{quickstart.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 历史版本 Tab ---------- */

function VersionsTab({
  versions,
  isLoading,
}: {
  versions: ChangelogEntry[];
  isLoading: boolean;
}) {
  if (isLoading) return <p className="text-ink-mute font-mono text-sm">加载中…</p>;
  if (!versions || versions.length === 0)
    return <p className="text-ink-mute font-sans">暂无版本记录</p>;
  return (
    <ol className="space-y-4">
      {versions.map((v) => (
        <li key={v.version} className="border-l-2 border-line pl-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-ink">v{v.version}</span>
            <span className="font-mono text-xs text-ink-mute">{v.date}</span>
            <Badge className="bg-canvas text-ink-soft border-line">{v.type}</Badge>
          </div>
          <ul className="text-sm text-ink-mute mt-1 list-disc list-inside space-y-0.5 font-sans">
            {v.changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/* ---------- 用户手册 Tab ---------- */

function ManualTab({ slug }: { slug: string }) {
  return (
    <article className={PROSE}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {stripFrontMatter(getManual(slug) || "")}
      </ReactMarkdown>
    </article>
  );
}

/* ---------- 文件清单 ---------- */

function FileList({ files }: { files?: SkillFile[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="glass-panel p-5">
      <h3 className="font-heading font-semibold text-ink mb-3">文件清单</h3>
      <ul className="text-sm space-y-1 font-mono">
        {files.map((f) => (
          <li
            key={f.path}
            className={`flex items-center justify-between gap-2 ${
              f.type === "dir" ? "text-ink-mute" : "text-ink"
            }`}
          >
            <span className="truncate">
              {f.type === "dir" ? "📁 " : "📄 "}
              {f.path}
            </span>
            {f.type === "file" && f.size > 0 && (
              <span className="text-xs text-ink-mute shrink-0">
                {formatSize(f.size)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 安装提示卡 ---------- */

function PromptCard({ slug }: { slug: string }) {
  const prompt = `请先检查是否已安装${slug},若未安装,请根据https://skills.ospreyai.cn/api/install/osprey-skill-market.md，安装${slug}技能。`;
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(prompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-ink">发送给你的 AI 安装</h3>
        <button
          onClick={onCopy}
          className="btn-glass text-xs px-3 py-1"
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed break-words whitespace-pre-wrap font-mono">
        {prompt}
      </p>
    </div>
  );
}

/* ---------- 复制工具 ---------- */

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ---------- 下载卡 ---------- */

function DownloadCard({
  slug,
  onDownloaded,
}: {
  slug: string;
  onDownloaded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const downloadUrl = `${BASE}/v1/skills/${encodeURIComponent(slug)}/download`;

  const onClick = () => {
    setBusy(true);
    setTimeout(() => {
      onDownloaded();
      setBusy(false);
    }, 1500);
  };

  return (
    <div className="glass-panel p-5">
      <h3 className="font-heading font-semibold text-ink mb-3">下载</h3>
      <a
        href={downloadUrl}
        download={`${slug}.zip`}
        onClick={onClick}
        className={`block text-center text-sm px-4 py-2.5 rounded-pill transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          busy
            ? "bg-[#e9e9eb] text-ink-mute cursor-default"
            : "btn-apple"
        }`}
      >
        {busy ? "下载中…" : "⬇ 下载技能(zip)"}
      </a>
      <p className="font-mono text-xs text-ink-mute mt-2 text-center">
        下载整个技能目录打包文件
      </p>
    </div>
  );
}

/* ---------- 工具函数 ---------- */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}

function stripFrontMatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trimStart();
}
