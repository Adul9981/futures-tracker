import { GammaEvent } from '@/lib/gamma-api'
import { CategoryConfig } from '@/data/polymarket-categories'
import EventCard from './EventCard'

interface CategorySectionProps {
  config: CategoryConfig
  events: GammaEvent[]
}

export default function CategorySection({ config, events }: CategorySectionProps) {
  return (
    <section id={config.id} className="scroll-mt-20">
      {/* Section header */}
      <div className="flex items-start gap-3 mb-5">
        <span className="text-2xl leading-none mt-0.5">{config.icon}</span>
        <div>
          <h2 className="text-lg font-bold text-white">{config.label}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{config.description}</p>
          <p className="text-xs text-[#00e8a2] mt-1 font-medium">💡 {config.tip}</p>
        </div>
      </div>

      {/* Cards grid */}
      {events.length === 0 ? (
        <div className="pm-empty">暂无活跃市场，稍后再来看看</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
