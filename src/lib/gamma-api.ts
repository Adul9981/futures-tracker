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

export async function fetchEventsByTag(tag: string, limit = 6): Promise<GammaEvent[]> {
  'use cache'
  cacheLife('hours')

  const url = `${GAMMA_API}/events?active=true&closed=false&archived=false&tag=${tag}&limit=${limit}&order=volume24hr&ascending=false`
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

export async function fetchEventsByKeyword(keyword: string, limit = 6): Promise<GammaEvent[]> {
  'use cache'
  cacheLife('hours')

  const url = `${GAMMA_API}/events?active=true&closed=false&archived=false&_q=${encodeURIComponent(keyword)}&limit=${limit}&order=volume24hr&ascending=false`
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

export async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  'use cache'
  cacheLife('hours')

  const url = `${GAMMA_API}/events?slug=${slug}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data: GammaEvent[] = await res.json()
  return data[0] ?? null
}

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
    const maxIdx = prices.indexOf(Math.max(...prices.map(Number)).toString())
    const pct = Math.round(Number(prices[maxIdx] ?? prices[0]) * 100)
    return `${outcomes[maxIdx] ?? outcomes[0]} ${pct}%`
  } catch {
    return null
  }
}
