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
      className="group block h-full bg-canvas2 rounded-card border border-line p-6 font-sans shadow-[0_1px_2px_rgba(27,29,28,0.05)] hover:border-lineStrong hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-12px_rgba(14,77,68,0.25)] transition-all"
    >
      {/* 头部：图标 + 名称 + 状态 */}
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none shrink-0">{skill.icon || "📦"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-semibold text-[19px] text-ink truncate">
              {skill.displayName}
            </h3>
            {skill.hot && (
              <span className="font-mono text-[9.5px] tracking-[0.1em] bg-[#C4552F] text-[#F4F2EA] px-1.5 py-0.5 rounded-[3px] shrink-0">
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
      className={`font-mono text-[10.5px] px-2 py-0.5 rounded-[3px] border ${className ?? "bg-canvas text-ink-soft border-line"}`}
    >
      {children}
    </span>
  );
}
