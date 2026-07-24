import { Link } from "react-router-dom";
import type { SkillListItem } from "@skill-market/shared";
import {
  RUNTIME_LABEL,
  RUNTIME_COLOR,
  BILLING_LABEL,
  BILLING_COLOR,
  SOURCE_LABEL,
  SOURCE_COLOR,
} from "../lib/labels";

export function SkillCard({ skill }: { skill: SkillListItem }) {
  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="block bg-canvas2 rounded-card border border-line p-6 hover:border-lineStrong hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none">{skill.icon || "📦"}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif font-medium text-lg text-ink truncate">
            {skill.displayName}
          </h3>
          <p className="text-sm text-ink-mute line-clamp-2 mt-1 font-sans">
            {skill.description}
          </p>
        </div>
      </div>
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
