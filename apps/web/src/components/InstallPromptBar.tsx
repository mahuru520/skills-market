/* 首页「一键安装」板块:复制提示词发给 AI 助手,自动安装本技能市场 */
import { useState } from "react";

const PROMPT =
  "根据 https://skills.ospreyai.cn/api/install/osprey-skill-market.md ，安装 Osprey Skill Market。";

export function InstallPromptBar() {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(PROMPT);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="bg-surface rounded-card shadow-card border border-line p-8 md:p-10">
      <div className="flex items-start gap-4">
        <span className="text-3xl leading-none">🛒</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-ink">把提示词发给 AI 助手</h3>
          <p className="text-sm text-ink-mute mt-1.5 leading-relaxed">
            复制下方提示词，粘贴到任意 AI 助手对话，它会通过 osprey-skill-market 协议自动安装本技能市场。
          </p>
        </div>
      </div>

      {/* 命令栏 */}
      <div className="mt-6 flex items-center gap-3 bg-canvas rounded-2xl border border-line pl-4 pr-1.5 py-1.5">
        <span className="text-brand text-sm font-mono shrink-0 select-none">›</span>
        <code className="flex-1 min-w-0 text-sm text-ink-soft whitespace-nowrap overflow-x-auto font-mono py-2">
          {PROMPT}
        </code>
        <button
          onClick={onCopy}
          aria-label="复制提示词"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-medium text-ink-soft bg-surface border border-line hover:border-brand/40 hover:text-brand transition-colors"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

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
