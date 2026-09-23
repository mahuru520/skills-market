import { Link, NavLink } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="glass-nav sticky top-0 z-20">
        <div className="max-w-market mx-auto px-6 h-14 flex items-center gap-8">
          <Link
            to="/"
            className="font-heading font-semibold text-[15px] text-ink tracking-tight inline-flex items-center gap-2"
          >
            <span className="w-[18px] h-[18px] rounded-[5px] bg-brand inline-flex items-center justify-center text-white text-[11px] font-bold shadow-[0_2px_8px_rgba(0,122,255,0.4)]">
              O
            </span>
            Osprey Skill Market
          </Link>
          <nav className="flex items-center gap-6 font-sans text-[14px] font-medium">
            <NavLink to="/" end className={({ isActive }) => navCls(isActive)}>
              首页
            </NavLink>
            <NavLink to="/skills" className={({ isActive }) => navCls(isActive)}>
              全部技能
            </NavLink>
            <NavLink to="/experts" className={({ isActive }) => navCls(isActive)}>
              专家
            </NavLink>
            <NavLink to="/connectors" className={({ isActive }) => navCls(isActive)}>
              连接器
            </NavLink>
            <a
              href="https://ai.ospreyai.cn/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0000009e] hover:text-ink transition-colors"
            >
              文档
            </a>
            <a
              href="https://open.ospreyai.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0000009e] hover:text-ink transition-colors"
            >
              订阅
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line py-8">
        <div className="max-w-market mx-auto px-6 flex items-center justify-between font-mono text-[11px] text-ink-mute">
          <span>Osprey Skill Market</span>
          <a
            href="https://ai.ospreyai.cn/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            建议与反馈 →
          </a>
        </div>
      </footer>
    </div>
  );
}

/* 导航链接:14px/500,未激活 #0000009e,下划线胶囊动效 */
function navCls(isActive: boolean) {
  return `group relative h-10 inline-flex items-center transition-colors ${
    isActive ? "text-ink font-semibold" : "text-[#0000009e] hover:text-ink"
  }`;
}
