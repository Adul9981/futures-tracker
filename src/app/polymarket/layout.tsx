import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Polymarket 新人导航 | 预测市场一站式入口',
  description: '精选加密货币涨跌、天气、马斯克推文、英雄联盟赛事、伊朗局势五大板块，帮你快速上手 Polymarket 预测市场',
}

export default function PolymarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
