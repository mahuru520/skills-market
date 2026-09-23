import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchExpertDetail, reportExpertInstall } from "../api/experts";
import { Badge } from "../components/SkillCard";
import type { ExpertDetail, ExpertDependency, QuickstartData } from "@skill-market/shared";

/* ================================================================ */
/*  主组件                                                           */
/* ================================================================ */

export function ExpertDetail() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "quickstart" | "prompt">("overview");

  const detailQ = useQuery({
    queryKey: ["expert", slug],
    queryFn: () => fetchExpertDetail(slug!),
    enabled: !!slug,
  });

  if (detailQ.isLoading) {
    return <div className="max-w-market mx-auto px-6 py-10 text-ink-mute font-mono text-sm">加载中…</div>;
  }
  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="max-w-market mx-auto px-6 py-10">
        <p className="text-ink-mute font-serif">专家不存在或加载失败。</p>
        <Link to="/experts" className="text-brand hover:underline mt-2 inline-block font-mono text-sm">
          ← 返回列表
        </Link>
      </div>
    );
  }

  const e = detailQ.data;

  return (
    <div className="max-w-market mx-auto px-6 py-8">
      <Link to="/experts" className="font-mono text-sm text-ink-mute hover:text-ink">
        ← 全部专家
      </Link>

      {/* 标题区 */}
      <div className="flex items-start gap-4 mt-4 mb-6">
        <span className="text-5xl leading-none">{e.icon || "🧠"}</span>
        <div className="flex-1">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-brand font-medium inline-flex items-center gap-2.5 mb-2.5">
            <span className="w-[5px] h-[5px] rounded-full bg-brand" />
            EXPERT · {e.type === "expert_team" ? "专家团队" : "单专家"}
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">{e.displayName}</h1>
          <p className="text-ink-mute mt-1 font-serif">{e.description}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge className="bg-brand-soft text-brand border-[#BFD3CF]">EXPERT</Badge>
            {e.invocationMode && (
              <Badge className="bg-canvas text-ink-soft border-line">{e.invocationMode}</Badge>
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
            <TabButton active={tab === "prompt"} onClick={() => setTab("prompt")}>
              专家提示词
            </TabButton>
          </div>

          {tab === "overview" ? (
            <OverviewTab detail={e} />
          ) : tab === "quickstart" ? (
            <QuickStartTab quickstart={e.quickstart} displayName={e.displayName} description={e.description} />
          ) : (
            <PromptTab prompt={e.prompt} slug={e.slug} />
          )}
        </div>

        {/* 右侧基础信息卡 */}
        <aside className="space-y-6">
          <InstallCard
            slug={e.slug}
            onInstalled={() => queryClient.invalidateQueries({ queryKey: ["expert", slug] })}
          />

          <div className="bg-canvas2 rounded-card border border-line p-5">
            <h3 className="font-serif font-semibold text-ink mb-3">基础信息</h3>
            <dl className="text-sm space-y-2 font-mono">
              <InfoRow label="类型" value={e.type === "expert_team" ? "专家团队" : "单专家"} />
              <InfoRow label="推荐权重" value={String(e.priority)} />
              <InfoRow label="发布方" value={e.ownerVerified ? `${e.ownerName} ✓` : e.ownerName} />
              <InfoRow label="版本" value={e.version} />
              <InfoRow
                label="更新时间"
                value={new Date(e.updatedAt).toLocaleDateString("zh-CN")}
              />
              <InfoRow label="安装数" value={String(e.installCount)} />
            </dl>
          </div>

          <DependencyCard title="依赖技能" deps={e.skills} basePath="/skills" emptyText="无必需技能" />
          <DependencyCard title="依赖连接器" deps={e.connectors} basePath="/connectors" emptyText="无必需连接器" />
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
      className={`pb-2 border-b-2 -mb-px transition-colors font-serif ${
        active
          ? "border-brand text-brand font-medium"
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

/* ---------- 概述 Tab:适用场景 + 依赖说明 ---------- */

function OverviewTab({ detail }: { detail: ExpertDetail }) {
  return (
    <div className="space-y-5">
      <div className="bg-canvas2 rounded-card border border-line p-5">
        <h2 className="font-serif text-xl font-medium text-ink mb-2">{detail.displayName}</h2>
        <p className="text-ink-soft text-sm leading-relaxed font-serif">{detail.description}</p>
      </div>

      {detail.quickstart && detail.quickstart.scenarios.length > 0 && (
        <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-canvas border-b border-line">
            <span className="text-base">🎯</span>
            <h3 className="font-serif font-medium text-ink text-sm">适用场景</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-1.5">
              {detail.quickstart.scenarios.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px] text-ink leading-relaxed font-serif">
                  <span className="text-ink-mute mt-0.5 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-canvas2 rounded-card border border-line p-5">
        <h3 className="font-serif font-medium text-ink text-sm mb-2">专家提示词结构</h3>
        <p className="text-sm text-ink-soft leading-relaxed font-serif">
          本专家的提示词由 expert_identity / expert_method / tool_policy / delivery 四块构成,
          切换到「专家提示词」页签可查看与复制全文。安装后提示词随专家落地为本地 subagent,
          离线可用。
        </p>
      </div>
    </div>
  );
}

/* ---------- 快速开始 Tab(与技能详情同构) ---------- */

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
      <div className="bg-canvas2 rounded-card border border-line p-8 text-center">
        <p className="text-ink-mute text-sm font-serif">
          该专家暂未生成快速开始摘要,
          <br />
          请切换到「概述」查看。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-canvas2 rounded-card border border-line p-5">
        <h2 className="font-serif text-xl font-medium text-ink mb-2">{displayName}</h2>
        <p className="text-ink-soft text-sm leading-relaxed font-serif">{quickstart.overview}</p>
        <p className="text-ink-mute text-xs mt-2 font-mono">{description}</p>
      </div>

      {quickstart.scenarios.length > 0 && (
        <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-canvas border-b border-line">
            <span className="text-base">🎯</span>
            <h3 className="font-serif font-medium text-ink text-sm">适用场景</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-1.5">
              {quickstart.scenarios.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px] text-ink leading-relaxed font-serif">
                  <span className="text-ink-mute mt-0.5 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {quickstart.example && (
        <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-canvas border-b border-line">
            <span className="text-base">🚀</span>
            <h3 className="font-serif font-medium text-ink text-sm">示例任务</h3>
          </div>
          <div className="p-5">
            <p className="text-[15px] text-ink leading-relaxed font-serif">{quickstart.example}</p>
          </div>
        </div>
      )}

      {quickstart.notes && (
        <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-canvas border-b border-line">
            <span className="text-base">⚠️</span>
            <h3 className="font-serif font-medium text-ink text-sm">注意事项</h3>
          </div>
          <div className="p-5">
            <p className="text-[15px] text-ink leading-relaxed font-serif">{quickstart.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 专家提示词 Tab:全文 + 复制 ---------- */

function PromptTab({ prompt, slug }: { prompt: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(prompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs text-ink-mute">
          local-expert:{slug} · 提示词全文
        </p>
        <button
          onClick={onCopy}
          className="font-mono text-xs px-2.5 py-1 rounded-full bg-canvas border border-line text-ink-soft hover:border-brand/40 transition-colors"
        >
          {copied ? "已复制" : "复制全文"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre rounded-lg border border-[#0A3A33] bg-brand-dark p-4 mb-5 text-sm">
        <code className="text-[#D9D6CD] font-mono">{prompt}</code>
      </pre>
    </div>
  );
}

/* ---------- 依赖卡 ---------- */

function DependencyCard({
  title,
  deps,
  basePath,
  emptyText,
}: {
  title: string;
  deps?: ExpertDependency[];
  basePath: string;
  emptyText: string;
}) {
  return (
    <div className="bg-canvas2 rounded-card border border-line p-5">
      <h3 className="font-serif font-semibold text-ink mb-3">{title}</h3>
      {!deps || deps.length === 0 ? (
        <p className="text-sm text-ink-mute font-mono">{emptyText}</p>
      ) : (
        <ul className="text-sm space-y-2 font-mono">
          {deps.map((d) => (
            <li key={d.name} className="flex items-start justify-between gap-2">
              <Link
                to={`${basePath}/${encodeURIComponent(d.name)}`}
                className="text-brand hover:underline break-all text-left"
              >
                {d.name}
              </Link>
              {d.required && (
                <span className="text-[10px] text-[#C4552F] border border-[#C4552F]/30 bg-[#C4552F]/5 px-1.5 py-0.5 rounded-[3px] shrink-0">
                  必需
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- 安装卡:复制提示词 + 上报计数 ---------- */

function InstallCard({
  slug,
  onInstalled,
}: {
  slug: string;
  onInstalled: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // 专家安装 = 复制提示词交给 AI 助手落盘(与技能安装提示词机制同构)
  const prompt = `请先检查是否已安装专家 ${slug},若未安装,请从 https://skills.ospreyai.cn/api/v1/experts/${slug} 获取详情,将其中 prompt 字段全文保存为本地 subagent 技能 local-expert:${slug}。`;

  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(prompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const onReport = async () => {
    setBusy(true);
    try {
      await reportExpertInstall(slug);
      setDone(true);
      onInstalled();
    } catch {
      /* 计数失败不阻塞 UI */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-canvas2 rounded-card border border-line p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-semibold text-ink">发送给你的 AI 安装</h3>
        <button
          onClick={onCopy}
          className="font-mono text-xs px-2.5 py-1 rounded-full bg-canvas border border-line text-ink-soft hover:border-brand/40 transition-colors"
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed break-words whitespace-pre-wrap font-mono">
        {prompt}
      </p>
      <button
        onClick={onReport}
        disabled={busy || done}
        className={`w-full mt-3 text-center font-mono text-sm px-4 py-2.5 rounded-card transition-colors ${
          done
            ? "bg-canvas border border-line text-ink-mute"
            : "bg-brand text-[#F4F2EA] hover:bg-brand-dark"
        }`}
      >
        {done ? "已上报安装" : busy ? "上报中…" : "✓ 我已安装(计数)"}
      </button>
      <p className="font-mono text-xs text-ink-mute mt-2 text-center">
        安装后即本地 subagent,离线可用
      </p>
    </div>
  );
}

/* ---------- 复制工具(与技能详情一致) ---------- */

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
