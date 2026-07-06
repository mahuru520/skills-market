import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchSkillDetail, fetchSkillVersions } from "../api/skills";
import { Badge } from "../components/SkillCard";
import {
  RUNTIME_LABEL,
  RUNTIME_COLOR,
  BILLING_LABEL,
  BILLING_COLOR,
  CATEGORY_LABEL,
} from "../lib/labels";
import type { SkillFile, ChangelogEntry } from "@skill-market/shared";

export function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<"overview" | "versions">("overview");

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
    return <div className="max-w-6xl mx-auto px-6 py-10 text-ink-mute">加载中…</div>;
  }
  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-ink-mute">技能不存在或加载失败。</p>
        <Link to="/skills" className="text-brand hover:underline mt-2 inline-block">
          ← 返回列表
        </Link>
      </div>
    );
  }

  const s = detailQ.data;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/skills" className="text-sm text-ink-mute hover:text-ink">
        ← 全部技能
      </Link>

      {/* 标题区 */}
      <div className="flex items-start gap-4 mt-4 mb-6">
        <span className="text-5xl leading-none">{s.icon || "📦"}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">{s.displayName}</h1>
          <p className="text-ink-mute mt-1">{s.description}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge className={RUNTIME_COLOR[s.runtimeType]}>
              {RUNTIME_LABEL[s.runtimeType] ?? s.runtimeType}
            </Badge>
            <Badge className={BILLING_COLOR[s.billing]}>
              {BILLING_LABEL[s.billing] ?? s.billing}
            </Badge>
            <Badge className="bg-gray-100 text-gray-700">
              {CATEGORY_LABEL[s.category] ?? s.category}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* 左侧主区 */}
        <div>
          {/* Tab */}
          <div className="border-b border-black/10 flex gap-6 mb-6">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
              概述
            </TabButton>
            <TabButton active={tab === "versions"} onClick={() => setTab("versions")}>
              历史版本
            </TabButton>
          </div>

          {tab === "overview" ? (
            <article className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {s.readme || "（无说明文档）"}
              </ReactMarkdown>
            </article>
          ) : (
            <VersionsTab
              versions={versionsQ.data ?? []}
              isLoading={versionsQ.isLoading}
            />
          )}
        </div>

        {/* 右侧基础信息卡 */}
        <aside className="space-y-6">
          <div className="bg-white rounded-card shadow-card p-5">
            <h3 className="font-semibold text-ink mb-3">基础信息</h3>
            <dl className="text-sm space-y-2">
              <InfoRow label="分类" value={CATEGORY_LABEL[s.category] ?? s.category} />
              <InfoRow label="运行方式" value={RUNTIME_LABEL[s.runtimeType] ?? s.runtimeType} />
              <InfoRow label="计费" value={BILLING_LABEL[s.billing] ?? s.billing} />
              <InfoRow label="版本" value={s.version} />
              <InfoRow label="来源" value={s.ownerName} />
              <InfoRow
                label="更新时间"
                value={new Date(s.updatedAt).toLocaleDateString("zh-CN")}
              />
              <InfoRow label="安装数" value={String(s.installCount)} />
            </dl>
          </div>

          {/* 文件清单 */}
          <FileList files={s.files} />
        </aside>
      </div>
    </div>
  );
}

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
      className={`pb-2 border-b-2 -mb-px transition-colors ${
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

function VersionsTab({
  versions,
  isLoading,
}: {
  versions: ChangelogEntry[];
  isLoading: boolean;
}) {
  if (isLoading) return <p className="text-ink-mute">加载中…</p>;
  if (!versions || versions.length === 0)
    return <p className="text-ink-mute">暂无版本记录</p>;
  return (
    <ol className="space-y-4">
      {versions.map((v) => (
        <li key={v.version} className="border-l-2 border-black/10 pl-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">v{v.version}</span>
            <span className="text-xs text-ink-mute">{v.date}</span>
            <Badge className="bg-gray-100 text-gray-600">{v.type}</Badge>
          </div>
          <ul className="text-sm text-ink-mute mt-1 list-disc list-inside space-y-0.5">
            {v.changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function FileList({ files }: { files?: SkillFile[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h3 className="font-semibold text-ink mb-3">文件清单</h3>
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}
