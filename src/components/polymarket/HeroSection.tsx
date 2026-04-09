import { getHomeLink } from '@/lib/polymarket-links'

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1f18] via-[#0d0e12] to-[#0d0e12] border border-[#2d2f36] p-8 md:p-12 mb-8">
      {/* Background glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#00e8a2]/5 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-[#00e8a2] bg-[#00e8a2]/10 border border-[#00e8a2]/20 rounded-full px-3 py-1 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e8a2] animate-pulse" />
          新手一站式入口
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          Polymarket<br />
          <span className="text-[#00e8a2]">预测市场导航</span>
        </h1>

        <p className="text-slate-400 text-base max-w-xl mb-6 leading-relaxed">
          精选 5 大板块 · 标注规则与截止时间 · 一键跳转交易<br />
          帮你快速找到感兴趣的预测市场，开始你的第一笔预测
        </p>

        <a
          href={getHomeLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#00e8a2] hover:bg-[#00d496] text-black font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          进入 Polymarket 主页
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
