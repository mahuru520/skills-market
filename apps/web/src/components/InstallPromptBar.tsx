/* 首页「一键安装」板块:复制提示词发给 AI 助手,自动安装本技能市场 */
import { useState } from "react";

const PROMPT =
  "根据 https://skills.ospreyai.cn/api/install/osprey-skill-market.md ，安装 Osprey Skill Market。";

const PROMPT_URL = "https://skills.ospreyai.cn/api/install/osprey-skill-market.md";

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
    <div>
      {/* 命令栏 */}
      <div className="flex items-start gap-2 bg-brand text-[#F4F2EA] rounded-[14px] pl-[18px] pr-2 py-2 shadow-[0_1px_0_#0A3A33,0_18px_30px_-22px_rgba(14,77,68,0.55)] min-w-0">
        <span className="font-mono text-[15px] font-semibold opacity-85 shrink-0 select-none pt-[7px]">›</span>
        <code className="flex-1 min-w-0 font-mono text-[13.5px] py-[7px] leading-[1.5] break-all">
          <span>根据 </span>
          <span className="text-[#9FD6CB]">{PROMPT_URL}</span>
          <span> ，安装 Osprey Skill Market。</span>
        </code>
        <button
          onClick={onCopy}
          aria-label="复制安装提示词"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 mt-[3px] rounded-[9px] text-xs font-mono font-medium text-[#F4F2EA] bg-white/10 border border-white/20 hover:bg-white/[0.22] hover:border-white/40 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F2EA]"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <p className="font-mono text-[11px] text-ink-mute mt-3 tracking-wide">
        粘贴到任意 AI 助手对话即可触发安装 · 协议 osprey-skill-market
      </p>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
