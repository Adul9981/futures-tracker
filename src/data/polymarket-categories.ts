export interface CategoryConfig {
  id: string
  label: string
  icon: string
  description: string
  tip: string
  /**
   * tag_slug  → fetchEventsByTagSlug(tagSlug)  — 通过 tag_slug= 参数筛选
   * slugs     → fetchEventBySlug(slug) x N      — 精确 slug 列表
   * musk      → fetchMuskTweetsEvent()           — 动态生成周度 slug
   */
  fetchStrategy: 'tag_slug' | 'slugs' | 'musk'
  tagSlug?: string
  slugs?: string[]
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'crypto',
    label: '加密货币涨跌',
    icon: '₿',
    description: 'BTC / ETH 短期价格方向预测（每小时 / 每日），滚动更新',
    tip: '看盘感觉好直接下注，结算快，适合有加密货币基础的新手',
    fetchStrategy: 'tag_slug',
    tagSlug: 'up-or-down',
  },
  {
    id: 'weather',
    label: '天气预测',
    icon: '🌤',
    description: '预测全球城市每日最高气温，数据来源为官方气象局，每天结算',
    tip: '结算周期最短，参与门槛低，适合快速体验预测市场',
    fetchStrategy: 'tag_slug',
    tagSlug: 'temperature',
  },
  {
    id: 'musk',
    label: '马斯克推文',
    icon: '𝕏',
    description: '预测马斯克本周发帖数量区间（主帖 + 转发，不含回复），每周四结算',
    tip: '7天周期、流动性极强，规律性明显，新手最推荐板块之一',
    fetchStrategy: 'musk',
  },
  {
    id: 'lol',
    label: '英雄联盟赛事',
    icon: '🎮',
    description: '预测 LPL / LCK / LEC 职业联赛 BO3 系列赛胜负，赛后即结算',
    tip: '熟悉赛事战队状态的玩家有天然信息优势',
    fetchStrategy: 'tag_slug',
    tagSlug: 'league-of-legends',
  },
  {
    id: 'iran',
    label: '伊朗局势',
    icon: '🌐',
    description: '预测美伊停火协议或冲突结束的时间节点，当前全站交易量最高地缘政治市场',
    tip: '总交易量超 2 亿美元，流动性极高，适合关注国际时事的玩家',
    fetchStrategy: 'slugs',
    slugs: ['us-x-iran-ceasefire-by', 'iran-x-israelus-conflict-ends-by'],
  },
]
