import { Link } from "react-router-dom";
import type { SkillListItem } from "@skill-market/shared";
import {
  RUNTIME_LABEL,
  RUNTIME_COLOR,
  BILLING_LABEL,
  BILLING_COLOR,
  SOURCE_LABEL,
  SOURCE_COLOR,
  CATEGORY_LABEL,
} from "../lib/labels";

export function SkillCard({ skill }: { skill: SkillListItem }) {
  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="glass-card glass-card-hover group block h-full p-6 font-sans"
    >
      {/* 头部：图标 + 名称 + 状态 */}
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none shrink-0">{skill.icon || "📦"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-[19px] text-ink tracking-tight truncate">
              {skill.displayName}
            </h3>
            {skill.hot && (
              <span className="font-mono text-[9.5px] tracking-[0.1em] bg-[#ff3b30] text-white px-1.5 py-0.5 rounded-[4px] shrink-0">
                HOT
              </span>
            )}
          </div>
          <p className="text-[12px] text-ink-mute mt-1 font-mono">
            v{skill.version} · {CATEGORY_LABEL[skill.category] ?? skill.category}
          </p>
        </div>
      </div>

      <p className="text-sm text-ink-soft mt-3 line-clamp-2 font-sans leading-relaxed">
        {skill.description}
      </p>

      {/* 标签 + 安装量 */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        <Badge className={RUNTIME_COLOR[skill.runtimeType]}>
          {RUNTIME_LABEL[skill.runtimeType] ?? skill.runtimeType}
        </Badge>
        <Badge className={BILLING_COLOR[skill.billing]}>
          {BILLING_LABEL[skill.billing] ?? skill.billing}
        </Badge>
        {SOURCE_LABEL[skill.source] && (
          <Badge className={SOURCE_COLOR[skill.source]}>
            {SOURCE_LABEL[skill.source]}
          </Badge>
        )}
        <span className="font-mono text-xs text-ink-mute ml-auto">
          ⬇ {skill.installCount}
        </span>
      </div>
    </Link>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-[10.5px] px-2 py-0.5 rounded-[6px] border ${className ?? "bg-white/60 text-ink-soft border-line"}`}
    >
      {children}
    </span>
  );
}
