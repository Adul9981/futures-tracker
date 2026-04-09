import { Suspense } from 'react'
import { fetchEventsByTagSlug, fetchEventsByMultipleTagSlugs, fetchEventBySlug, fetchMuskTweetsEvent, GammaEvent } from '@/lib/gamma-api'
import { CATEGORIES, CategoryConfig } from '@/data/polymarket-categories'
import HeroSection from '@/components/polymarket/HeroSection'
import CategoryNav from '@/components/polymarket/CategoryNav'
import CategorySection from '@/components/polymarket/CategorySection'

async function fetchCategoryEvents(config: CategoryConfig): Promise<GammaEvent[]> {
  if (config.fetchStrategy === 'tag_slug' && config.tagSlug) {
    return fetchEventsByTagSlug(config.tagSlug, 6)
  }
  if (config.fetchStrategy === 'multi_tag_slug' && config.tagSlugs) {
    return fetchEventsByMultipleTagSlugs(config.tagSlugs)
  }
  if (config.fetchStrategy === 'musk') {
    const event = await fetchMuskTweetsEvent()
    return event ? [event] : []
  }
  if (config.fetchStrategy === 'slugs' && config.slugs) {
    const results = await Promise.allSettled(config.slugs.map(fetchEventBySlug))
    return results
      .filter((r): r is PromiseFulfilledResult<GammaEvent> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
  }
  return []
}

async function AllCategories() {
  const categoryData = await Promise.allSettled(
    CATEGORIES.map(async (cat) => ({
      config: cat,
      events: await fetchCategoryEvents(cat),
    }))
  )

  return (
    <div className="flex flex-col gap-12">
      {categoryData.map((result, i) => {
        if (result.status === 'rejected') {
          return (
            <section key={i} className="pm-empty">
              该板块数据加载失败，请刷新重试
            </section>
          )
        }
        const { config, events } = result.value
        return (
          <CategorySection key={config.id} config={config} events={events} />
        )
      })}
    </div>
  )
}

export default function PolymarketPage() {
  return (
    <div className="min-h-screen bg-[#0d0e12] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <HeroSection />
        <CategoryNav />
        <Suspense fallback={<LoadingSkeleton />}>
          <AllCategories />
        </Suspense>
        <footer className="mt-16 pt-8 border-t border-[#2d2f36] text-center text-xs text-slate-600">
          数据来源 Polymarket Gamma API · 每小时自动更新 · 仅供参考，不构成投资建议
        </footer>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex gap-3 mb-5">
            <div className="w-8 h-8 rounded bg-[#1a1b1e]" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-5 w-32 rounded bg-[#1a1b1e]" />
              <div className="h-4 w-64 rounded bg-[#1a1b1e]" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-40 rounded-xl bg-[#1a1b1e]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
