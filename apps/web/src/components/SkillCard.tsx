import { Link } from "react-router-dom";
import type { SkillListItem } from "@skill-market/shared";
import {
  RUNTIME_LABEL,
  RUNTIME_COLOR,
  BILLING_LABEL,
  BILLING_COLOR,
} from "../lib/labels";

export function SkillCard({ skill }: { skill: SkillListItem }) {
  return (
    <Link
      to={`/skills/${skill.slug}`}
      className="block bg-white rounded-card shadow-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none">{skill.icon || "📦"}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink truncate">
            {skill.displayName}
          </h3>
          <p className="text-sm text-ink-mute line-clamp-2 mt-1">
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
        <span className="text-xs text-ink-mute ml-auto">
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
      className={`text-xs px-2 py-0.5 rounded-full ${className ?? "bg-gray-100 text-gray-700"}`}
    >
      {children}
    </span>
  );
}
