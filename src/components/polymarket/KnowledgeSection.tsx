const MARKET_TYPES = [
  {
    icon: '🆕',
    title: '新市场冷启动',
    tag: '高偏差窗口',
    tagColor: 'text-yellow-400 bg-yellow-400/10',
    desc: '上线 < 48h，市场定价尚未充分，是早期进场捕捉最大价格偏差的黄金窗口。',
    hint: '关注刚上线的市场，对比自己的判断与当前价格的差距。',
  },
  {
    icon: '⚡',
    title: '突发事件狙击',
    tag: '紧迫型',
    tagColor: 'text-orange-400 bg-orange-400/10',
    desc: '外部事件（新闻、声明、数据）触发价格异动，需在 30 分钟内完成判断和建仓。',
    hint: '反应速度是核心优势，适合盯盘且判断力强的玩家。',
  },
  {
    icon: '⏰',
    title: '临期理财',
    tag: '稳健型',
    tagColor: 'text-blue-400 bg-blue-400/10',
    desc: '1–7 天内到期、No 方概率极高（>80%）的市场，买入 No 吃剩余时间价值，类似低风险理财。',
    hint: '注意留意黑天鹅风险，别因为"稳"而重仓。',
  },
  {
    icon: '🔬',
    title: '基本面套利',
    tag: '信息型',
    tagColor: 'text-purple-400 bg-purple-400/10',
    desc: '市场定价明显偏离客观现实，需要信息优势，中长期持有等待价格回归。',
    hint: '适合深耕某个领域（政治、体育、科技）的专业玩家。',
  },
  {
    icon: '🎰',
    title: '彩票仓位',
    tag: '高赔率',
    tagColor: 'text-red-400 bg-red-400/10',
    desc: '以 5–20¢ 买入低概率事件，心理上视为已亏损的仓位，赌小博大。',
    hint: '控制仓位比例，不能因为便宜就加码，总敞口不超过 5%。',
  },
  {
    icon: '👁️',
    title: '常识型',
    tag: '低风险',
    tagColor: 'text-green-400 bg-green-400/10',
    desc: '公众人物固定行为习惯或已知结果被市场错误定价，胜率极高，类似捡钱。',
    hint: '典型例子：马斯克每周推文数、定期公告后的价格修正。',
  },
]

const BASICS = [
  {
    q: '价格即概率',
    a: '一个市场报价 $0.65 YES，意味着当前市场认为该事件发生的概率是 65%。你买入 YES 相当于押注它会发生。',
  },
  {
    q: '如何结算',
    a: '事件发生后，正确一方的份额价值变为 $1.00，错误一方归零。买入价格越低，潜在利润越高。',
  },
  {
    q: '可以提前离场',
    a: '不需要等到结算。只要有人愿意接单，你随时可以在市场上卖出持仓，锁定利润或止损。',
  },
  {
    q: '流动性影响滑点',
    a: '交易量越大的市场，买卖价差越小、滑点越低。新手建议优先选择交易量 > $10K 的市场。',
  },
]

export default function KnowledgeSection() {
  return (
    <section className="mb-12">
      {/* ── 标题 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">📚</span>
        <h2 className="text-lg font-bold text-white">新手知识库</h2>
        <span className="text-xs text-slate-500 ml-1">· 了解策略类型，找到适合你的玩法</span>
      </div>

      {/* ── 六类市场策略 ─────────────────────────────────────── */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
        六类市场策略
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {MARKET_TYPES.map((item) => (
          <div
            key={item.title}
            className="bg-[#1a1b1e] border border-[#2d2f36] rounded-xl p-4 flex flex-col gap-2 hover:border-[#3d3f46] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-sm font-semibold text-white">{item.title}</span>
              <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${item.tagColor}`}>
                {item.tag}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            <p className="text-[11px] text-slate-500 border-t border-[#2d2f36] pt-2 leading-relaxed">
              💡 {item.hint}
            </p>
          </div>
        ))}
      </div>

      {/* ── 基础概念速查 ─────────────────────────────────────── */}
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
        基础概念速查
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BASICS.map((item) => (
          <div
            key={item.q}
            className="bg-[#1a1b1e] border border-[#2d2f36] rounded-xl p-4 flex flex-col gap-1.5"
          >
            <p className="text-xs font-semibold text-[#00e8a2]">{item.q}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
