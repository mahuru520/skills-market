import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchConnectorDetail,
  reportConnectorInstall,
} from "../api/connectors";
import { Badge } from "../components/SkillCard";
import type {
  ConnectorDetail,
  ConnectorInstallTemplate,
  EnvVar,
  QuickstartData,
} from "@skill-market/shared";

/* ================================================================ */
/*  主组件                                                           */
/* ================================================================ */

const AUTH_LABEL: Record<string, string> = {
  none: "免鉴权",
  env_key: "需要 API Key",
  oauth: "OAuth 授权",
};

export function ConnectorDetail() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["connector", slug],
    queryFn: () => fetchConnectorDetail(slug!),
    enabled: !!slug,
  });

  if (detailQ.isLoading) {
    return <div className="max-w-market mx-auto px-6 py-10 text-ink-mute font-mono text-sm">加载中…</div>;
  }
  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="max-w-market mx-auto px-6 py-10">
        <p className="text-ink-mute font-serif">连接器不存在或加载失败。</p>
        <Link to="/connectors" className="text-brand hover:underline mt-2 inline-block font-mono text-sm">
          ← 返回列表
        </Link>
      </div>
    );
  }

  const c = detailQ.data;

  return (
    <div className="max-w-market mx-auto px-6 py-8">
      <Link to="/connectors" className="font-mono text-sm text-ink-mute hover:text-ink">
        ← 全部连接器
      </Link>

      {/* 标题区 */}
      <div className="flex items-start gap-4 mt-4 mb-6">
        <span className="text-5xl leading-none">{c.icon || "🔌"}</span>
        <div className="flex-1">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-brand font-medium inline-flex items-center gap-2.5 mb-2.5">
            <span className="w-[5px] h-[5px] rounded-full bg-brand" />
            CONNECTOR · {c.kind.toUpperCase()}
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">{c.displayName}</h1>
          <p className="text-ink-mute mt-1 font-serif">{c.description}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge className="bg-sky-50 text-sky-700 border-sky-100">MCP</Badge>
            <Badge className="bg-canvas text-ink-soft border-line">
              {AUTH_LABEL[c.authMethod] ?? c.authMethod}
            </Badge>
            {c.tags?.slice(0, 3).map((t) => (
              <Badge key={t} className="bg-canvas text-ink-mute border-line">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
        {/* 左侧主区 */}
        <div className="min-w-0 space-y-6">
          {/* 安装配置模板 —— 连接器详情核心 */}
          <InstallTemplateCard template={c.installTemplate} slug={c.slug} />

          {/* 环境变量表 */}
          <EnvVarsCard envVars={c.envVars} authMethod={c.authMethod} />

          {/* 能力摘要 */}
          {c.capabilitiesSummary && (
            <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-canvas border-b border-line">
                <span className="text-base">🧰</span>
                <h3 className="font-serif font-medium text-ink text-sm">提供的能力</h3>
              </div>
              <div className="p-5">
                <p className="text-[15px] text-ink leading-relaxed font-mono">
                  {c.capabilitiesSummary}
                </p>
              </div>
            </div>
          )}

          {/* 快速开始 */}
          {c.quickstart && <QuickStartCard quickstart={c.quickstart} />}
        </div>

        {/* 右侧基础信息卡 */}
        <aside className="space-y-6">
          <InstallReportCard
            slug={c.slug}
            onInstalled={() => queryClient.invalidateQueries({ queryKey: ["connector", slug] })}
          />

          <div className="bg-canvas2 rounded-card border border-line p-5">
            <h3 className="font-serif font-semibold text-ink mb-3">基础信息</h3>
            <dl className="text-sm space-y-2 font-mono">
              <InfoRow label="类型" value={`MCP · ${c.installTemplate.transport}`} />
              <InfoRow label="鉴权" value={AUTH_LABEL[c.authMethod] ?? c.authMethod} />
              <InfoRow label="发布方" value={c.ownerVerified ? `${c.ownerName} ✓` : c.ownerName} />
              <InfoRow label="版本" value={c.version} />
              <InfoRow
                label="更新时间"
                value={new Date(c.updatedAt).toLocaleDateString("zh-CN")}
              />
              <InfoRow label="安装数" value={String(c.installCount)} />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  子组件                                                           */
/* ================================================================ */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="text-ink text-right break-all">{value}</dd>
    </div>
  );
}

/* ---------- 安装配置模板卡:JSON + 复制 ---------- */

function InstallTemplateCard({
  template,
  slug,
}: {
  template: ConnectorInstallTemplate;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  // 客户端合成后的形状:模板 + 元信息,可直接粘给 AI 助手安装
  const installPrompt = `请为我安装 MCP 连接器 ${slug}:使用以下配置添加 MCP server,${VAR_HINT(template)}。配置:\n${JSON.stringify(template, null, 2)}`;

  const onCopy = async () => {
    const ok = await copyText(installPrompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-canvas border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-base">⚙️</span>
          <h3 className="font-serif font-medium text-ink text-sm">安装配置模板</h3>
        </div>
        <button
          onClick={onCopy}
          className="font-mono text-xs px-2.5 py-1 rounded-full bg-canvas border border-line text-ink-soft hover:border-brand/40 transition-colors"
        >
          {copied ? "已复制" : "复制安装指令"}
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-ink-soft leading-relaxed font-serif mb-3">
          按此模板写入你的 Agent MCP 配置即可接入。
          {VAR_HINT(template)}
        </p>
        <pre className="overflow-x-auto rounded-lg border border-[#0A3A33] bg-brand-dark p-4 text-sm">
          <code className="text-[#D9D6CD] font-mono">
            {JSON.stringify(template, null, 2)}
          </code>
        </pre>
      </div>
    </div>
  );
}

/* ${VAR} 占位符提示 */

function VAR_HINT(template: ConnectorInstallTemplate): string {
  const vars = new Set<string>();
  const scan = (v: unknown) => {
    if (typeof v === "string") {
      for (const m of v.matchAll(/\$\{([A-Z0-9_]+)\}/g)) vars.add(m[1]);
    } else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === "object") Object.values(v).forEach(scan);
  };
  scan(template);
  if (vars.size === 0) return "该连接器无需额外配置";
  return `其中 ${[...vars].map((v) => `${v}`).join("、")} 需替换为下方环境变量的真实值`;
}

/* ---------- 环境变量卡 ---------- */

function EnvVarsCard({
  envVars,
  authMethod,
}: {
  envVars?: EnvVar[];
  authMethod: string;
}) {
  if (!envVars || envVars.length === 0) {
    return (
      <div className="bg-canvas2 rounded-card border border-line p-5">
        <h3 className="font-serif font-semibold text-ink mb-2">环境变量</h3>
        <p className="text-sm text-ink-mute font-mono">
          {authMethod === "none" ? "免鉴权,无需配置" : "无额外环境变量"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-canvas2 rounded-card border border-line overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-canvas border-b border-line">
        <span className="text-base">🔐</span>
        <h3 className="font-serif font-medium text-ink text-sm">环境变量</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-lineStrong">
              <th className="bg-canvas px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft font-mono">变量</th>
              <th className="bg-canvas px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft font-mono">说明</th>
              <th className="bg-canvas px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft font-mono">示例</th>
            </tr>
          </thead>
          <tbody>
            {envVars.map((v) => (
              <tr key={v.key} className="border-b border-line last:border-none hover:bg-canvas2/60">
                <td className="px-3 py-2.5 font-mono text-ink align-top">
                  {v.key}
                  {v.required && (
                    <span className="ml-1.5 text-[10px] text-[#C4552F]">必需</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-soft font-serif align-top">
                  {v.description}
                  {v.source && (
                    <span className="block text-xs text-ink-mute mt-0.5 font-mono">来源:{v.source}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-mute align-top break-all">
                  {v.example}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- 快速开始卡 ---------- */

function QuickStartCard({ quickstart }: { quickstart: QuickstartData }) {
  return (
    <div className="space-y-5">
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

/* ---------- 安装上报卡 ---------- */

function InstallReportCard({
  slug,
  onInstalled,
}: {
  slug: string;
  onInstalled: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onReport = async () => {
    setBusy(true);
    try {
      await reportConnectorInstall(slug);
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
      <h3 className="font-serif font-semibold text-ink mb-3">已安装?</h3>
      <button
        onClick={onReport}
        disabled={busy || done}
        className={`w-full text-center font-mono text-sm px-4 py-2.5 rounded-card transition-colors ${
          done
            ? "bg-canvas border border-line text-ink-mute"
            : "bg-brand text-[#F4F2EA] hover:bg-brand-dark"
        }`}
      >
        {done ? "已上报安装" : busy ? "上报中…" : "✓ 我已安装(计数)"}
      </button>
      <p className="font-mono text-xs text-ink-mute mt-2 text-center">
        连接器无 zip 包,安装 = 复制配置模板写入 MCP 配置
      </p>
    </div>
  );
}

/* ---------- 复制工具(与技能/专家详情一致) ---------- */

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
