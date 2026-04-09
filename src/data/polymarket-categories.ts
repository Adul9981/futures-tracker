export interface CategoryConfig {
  id: string
  label: string
  icon: string
  description: string
  tip: string
  fetchStrategy: 'tag' | 'keyword' | 'slugs'
  tag?: string
  keyword?: string
  slugs?: string[]
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'crypto',
    label: '加密货币涨跌',
    icon: '₿',
    description: 'BTC / ETH / SOL 短期价格方向预测，最短5分钟一个周期，滚动更新',
    tip: '适合有加密货币基础的新手，看盘感觉好可以直接下注',
    fetchStrategy: 'keyword',
    keyword: 'Up or Down',
  },
  {
    id: 'weather',
    label: '天气预测',
    icon: '🌤',
    description: '预测城市每日最高气温或特定天气现象，数据来源为官方气象局',
    tip: '每日结算、周期短，适合快速体验预测市场',
    fetchStrategy: 'tag',
    tag: 'weather',
  },
  {
    id: 'musk',
    label: '马斯克推文',
    icon: '𝕏',
    description: '预测马斯克本周发帖数量区间（主帖 + 转发，不含回复），7天一周期，交易量超大',
    tip: '7天结算，流动性强，规律性好找，新手最推荐板块之一',
    fetchStrategy: 'keyword',
    keyword: 'Elon Musk tweets',
  },
  {
    id: 'lol',
    label: '英雄联盟赛事',
    icon: '🎮',
    description: '预测 LPL / LCK / LEC 职业联赛 BO3 系列赛结果，赛后即结算',
    tip: '熟悉赛事战队胜率的玩家有天然优势',
    fetchStrategy: 'tag',
    tag: 'league-of-legends',
  },
  {
    id: 'iran',
    label: '伊朗局势',
    icon: '🌐',
    description: '预测美伊停火协议或冲突结束的时间节点，当前最热门地缘政治市场',
    tip: '交易量超2亿美元，流动性极高，适合关注时事的玩家',
    fetchStrategy: 'slugs',
    slugs: ['us-x-iran-ceasefire-by', 'iran-x-israelus-conflict-ends-by'],
  },
]
