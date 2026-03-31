'use client'

import { useState, useEffect } from 'react'

interface Trade {
  id: number
  symbol: string
  direction: string
  entry_price: string
  stop_loss: string
  take_profit: string
  leverage: number
  capital: string
  result: string
  pnl: string
  created_at: string
}

interface Stats {
  total: number
  wins: number
  losses: number
  winRate: number
  totalPnl: number
  totalRoi: number
  avgWin: number
  avgLoss: number
  maxWin: number
  maxLoss: number
}

export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/trades')
      const data = await res.json()
      if (data.trades) setTrades(data.trades)
      if (data.stats) setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: '交易记录已保存' })
        setInput('')
        setRefreshKey(k => k + 1)
      }
    } catch {
      setMessage({ type: 'error', text: '提交失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const handleFixAll = async () => {
    setFixing(true)
    try {
      const res = await fetch('/api/trades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixAll: true })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setRefreshKey(k => k + 1)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: '修复失败' })
    } finally {
      setFixing(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/trades?id=${id}`, { method: 'DELETE' })
      setRefreshKey(k => k + 1)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const calculateRoi = (trade: Trade) => {
    const pnl = parseFloat(trade.pnl)
    const capital = parseFloat(trade.capital)
    if (capital === 0) return 0
    return (pnl / capital) * 100
  }

  const formatPrice = (price: string | number) => {
    return Math.round(parseFloat(String(price)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            合约交易统计
          </h1>
          <p className="text-slate-400">记录每一笔交易，分析你的盈亏</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-10">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-slate-400 text-sm">输入交易记录</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入交易记录，如：ETH 2075空 2085止损 2035止盈 90倍 本金15U 止盈"
              className="w-full h-28 bg-slate-900/50 rounded-xl p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-700 font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-slate-500 text-xs">支持多种格式：ETH 2075空 止损2085 止盈2035 90倍</span>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {loading ? '提交中...' : '添加记录'}
              </button>
            </div>
          </div>
          {message && (
            <div className={`mt-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}
        </form>

        {stats && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-300">数据概览</h2>
              <button
                onClick={handleFixAll}
                disabled={fixing}
                className="text-xs bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                {fixing ? '修复中...' : '🔧 修复历史数据'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="总交易" 
                value={stats.total} 
                icon="📊"
                gradient="from-blue-500/20 to-blue-600/10 border-blue-500/30"
              />
              <StatCard 
                label="胜率" 
                value={`${stats.winRate}%`} 
                icon="🎯"
                gradient="from-purple-500/20 to-purple-600/10 border-purple-500/30"
                color={stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}
              />
              <StatCard 
                label="总盈亏" 
                value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}U`} 
                icon={stats.totalPnl >= 0 ? '💰' : '💸'}
                gradient={stats.totalPnl >= 0 ? 'from-green-500/20 to-green-600/10 border-green-500/30' : 'from-red-500/20 to-red-600/10 border-red-500/30'}
                color={stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
              />
              <StatCard 
                label="总回报率" 
                value={`${stats.totalRoi >= 0 ? '+' : ''}${stats.totalRoi.toFixed(2)}%`} 
                icon="📈"
                gradient={stats.totalRoi >= 0 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' : 'from-rose-500/20 to-rose-600/10 border-rose-500/30'}
                color={stats.totalRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatCard 
                label="盈利次数" 
                value={stats.wins} 
                icon="✅"
                gradient="from-emerald-500/20 to-emerald-600/10 border-emerald-500/30"
                color="text-emerald-400"
              />
              <StatCard 
                label="亏损次数" 
                value={stats.losses} 
                icon="❌"
                gradient="from-rose-500/20 to-rose-600/10 border-rose-500/30"
                color="text-rose-400"
              />
              <StatCard 
                label="平均盈利" 
                value={`+${stats.avgWin.toFixed(2)}U`} 
                icon="📈"
                gradient="from-green-500/20 to-green-600/10 border-green-500/30"
                color="text-green-400"
              />
              <StatCard 
                label="平均亏损" 
                value={`${stats.avgLoss.toFixed(2)}U`} 
                icon="📉"
                gradient="from-red-500/20 to-red-600/10 border-red-500/30"
                color="text-red-400"
              />
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-300 flex items-center gap-2">
            <span>📋</span> 交易记录
          </h2>
          {trades.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-slate-500">暂无交易记录，开始记录你的第一笔交易吧</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-3 px-3 font-medium">时间</th>
                    <th className="text-left py-3 px-3 font-medium">币种</th>
                    <th className="text-center py-3 px-3 font-medium">方向</th>
                    <th className="text-right py-3 px-3 font-medium">开仓价</th>
                    <th className="text-right py-3 px-3 font-medium">止盈</th>
                    <th className="text-right py-3 px-3 font-medium">止损</th>
                    <th className="text-center py-3 px-3 font-medium">杠杆</th>
                    <th className="text-right py-3 px-3 font-medium">本金</th>
                    <th className="text-right py-3 px-3 font-medium">盈亏</th>
                    <th className="text-right py-3 px-3 font-medium">回报率</th>
                    <th className="text-center py-3 px-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const roi = calculateRoi(trade)
                    return (
                    <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-3 text-slate-400 text-xs">{new Date(trade.created_at).toLocaleString('zh-CN')}</td>
                      <td className="py-3 px-3 font-semibold">{trade.symbol}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${trade.direction === 'long' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                          {trade.direction === 'long' ? '多' : '空'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatPrice(trade.entry_price)}</td>
                      <td className="py-3 px-3 text-right font-mono text-green-400">{formatPrice(trade.take_profit)}</td>
                      <td className="py-3 px-3 text-right font-mono text-red-400">{formatPrice(trade.stop_loss)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">{trade.leverage}x</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{trade.capital}U</td>
                      <td className={`py-3 px-3 text-right font-bold font-mono ${parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(trade.pnl) >= 0 ? '+' : ''}{parseFloat(trade.pnl).toFixed(2)}U
                      </td>
                      <td className={`py-3 px-3 text-right font-bold font-mono ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button 
                          onClick={() => handleDelete(trade.id)} 
                          className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="text-center mt-10 text-slate-500 text-sm">
          合约交易统计工具 · 数据仅供参考
        </footer>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, gradient, color = 'text-white' }: { label: string; value: string | number; icon: string; gradient: string; color?: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 border backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
