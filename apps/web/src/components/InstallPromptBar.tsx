/* 首页安装提示词条:点击右侧图标复制提示词,供粘贴到 AI 助手安装本技能市场 */
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
    <div className="max-w-4xl mx-auto mt-5 flex items-center justify-center gap-3">
      {/* 左:彩色标签 + 指向箭头 */}
      <span className="text-sm font-semibold text-brand shrink-0 whitespace-nowrap">
        复制给 AI 助手安装 “Osprey-Skill-Market”
        <span className="text-ink-soft font-normal ml-2">›</span>
      </span>

      <div className="flex items-center gap-3 bg-surface rounded-2xl border border-line shadow-card px-4 py-3 flex-1 max-w-2xl">
        {/* 提示词 */}
        <code className="flex-1 min-w-0 text-sm text-ink-soft whitespace-nowrap overflow-x-auto font-mono">
          {PROMPT}
        </code>

        {/* 右:复制图标 */}
        <button
          onClick={onCopy}
          aria-label="复制提示词"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-canvas border border-line text-ink-soft hover:border-brand/40 hover:text-brand transition-colors"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
