'use client'

import { CATEGORIES } from '@/data/polymarket-categories'

export default function CategoryNav() {
  return (
    <nav className="sticky top-0 z-20 bg-[#0d0e12]/90 backdrop-blur border-b border-[#2d2f36] -mx-4 px-4 mb-8">
      <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white hover:bg-[#1a1b1e] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
