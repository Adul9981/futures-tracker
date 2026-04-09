import { cacheLife } from 'next/cache'

const GAMMA_API = 'https://gamma-api.polymarket.com'

export interface GammaMarket {
  id: string
  question: string
  conditionId: string
  slug: string
  resolutionSource: string
  endDate: string
  liquidity: number
  startDate: string
  image: string
  icon: string
  description: string
  outcomes: string
  outcomePrices: string
  volume: number
  active: boolean
  closed: boolean
}

export interface GammaEvent {
  id: string
  title: string
  slug: string
  description: string
  startDate: string
  endDate: string
  image: string
  icon: string
  active: boolean
  closed: boolean
  archived: boolean
  volume: number
  volume24hr: number
  liquidity: number
  markets: GammaMarket[]
}

/** 通过 tag_slug 查询活跃事件（唯一有效的 tag 过滤方式）*/
export async function fetchEventsByTagSlug(tagSlug: string, limit = 6): Promise<GammaEvent[]> {
  'use cache'
  cacheLife('hours')

  const url = `${GAMMA_API}/events?active=true&closed=false&archived=false&tag_slug=${tagSlug}&limit=${limit}&order=volume24hr&ascending=false`
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

/** 通过精确 slug 查询单个事件 */
export async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  'use cache'
  cacheLife('hours')

  const url = `${GAMMA_API}/events?slug=${slug}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data: GammaEvent[] = await res.json()
  return data[0] ?? null
}

/**
 * 动态生成马斯克推文市场的 slug。
 * 规则：每周四 12:00 ET 到下周四 12:00 ET 为一个周期。
 * slug 格式：elon-musk-of-tweets-{month1}-{day1}-{month2}-{day2}
 */
function getMuskTweetsSlug(referenceDate?: Date): string {
  const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ]

  // 以 ET 时区的"今天"为基准找最近的周四（开始日）
  const now = referenceDate ?? new Date()
  // 转换为 ET（UTC-4 夏令 / UTC-5 冬令），简单用 UTC-4 近似
  const etOffset = -4 * 60 // 分钟
  const etNow = new Date(now.getTime() + (etOffset - now.getTimezoneOffset()) * 60000)

  const dayOfWeek = etNow.getDay() // 0=Sun, 4=Thu
  // 距离上一个周四的天数
  const daysToLastThursday = (dayOfWeek + 3) % 7 // Thu=4 → 0, Fri=5 → 1, ...
  const startDate = new Date(etNow)
  startDate.setDate(etNow.getDate() - daysToLastThursday)

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 7)

  const startMonth = MONTHS[startDate.getMonth()]
  const endMonth = MONTHS[endDate.getMonth()]

  return `elon-musk-of-tweets-${startMonth}-${startDate.getDate()}-${endMonth}-${endDate.getDate()}`
}

/** 自动找当前周的马斯克推文事件，若未找到则尝试前后一周 */
export async function fetchMuskTweetsEvent(): Promise<GammaEvent | null> {
  'use cache'
  cacheLife('hours')

  const now = new Date()
  const offsets = [0, 7, -7] // 当周、下周、上周

  for (const offsetDays of offsets) {
    const ref = new Date(now)
    ref.setDate(now.getDate() + offsetDays)
    const slug = getMuskTweetsSlug(ref)
    const event = await fetchEventBySlug(slug)
    if (event && !event.archived && !event.closed) return event
  }
  return null
}

// ── 工具函数 ────────────────────────────────────────────────────────────────

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export function formatEndDate(isoDate: string): string {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleString('zh-CN', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' ET'
}

export function getTopOutcomeLabel(market: GammaMarket): string | null {
  try {
    const outcomes: string[] = JSON.parse(market.outcomes)
    const prices: string[] = JSON.parse(market.outcomePrices)
    if (!outcomes.length || !prices.length) return null
    const nums = prices.map(Number)
    const maxVal = Math.max(...nums)
    const maxIdx = nums.indexOf(maxVal)
    const pct = Math.round(maxVal * 100)
    return `${outcomes[maxIdx]} ${pct}%`
  } catch {
    return null
  }
}
