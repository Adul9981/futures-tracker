import { GammaEvent, formatVolume, formatEndDate, getTopOutcomeLabel } from '@/lib/gamma-api'
import { getEventLink } from '@/lib/polymarket-links'

interface EventCardProps {
  event: GammaEvent
}

export default function EventCard({ event }: EventCardProps) {
  const link = getEventLink(event.slug)
  const primaryMarket = event.markets?.[0]
  const topOutcome = primaryMarket ? getTopOutcomeLabel(primaryMarket) : null
  const endDate = formatEndDate(event.endDate || primaryMarket?.endDate || '')
  const vol24h = event.volume24hr ?? 0
  const totalVol = event.volume ?? 0

  return (
    <div className="pm-card group">
      <div className="flex flex-col gap-3 h-full">
        {/* Title */}
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#00e8a2] transition-colors">
          {event.title}
        </h3>

        {/* Top outcome probability */}
        {topOutcome && (
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00e8a2] shrink-0" />
            <span className="text-[#00e8a2] font-medium">{topOutcome}</span>
          </div>
        )}

        {/* Rules excerpt */}
        {event.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ClockIcon />
              {endDate}
            </span>
            <span className="flex items-center gap-1">
              <VolumeIcon />
              {vol24h > 0 ? `${formatVolume(vol24h)}/24h` : formatVolume(totalVol)}
            </span>
          </div>

          {/* CTA */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="pm-btn-trade"
          >
            前往交易 →
          </a>
        </div>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" d="M12 6v6l4 2" strokeWidth="2" />
    </svg>
  )
}

function VolumeIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
