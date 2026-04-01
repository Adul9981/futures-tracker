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

  const formatPrice = (price: string | number) => Math.round(parseFloat(String(price)))
  const formatCapital = (capital: string | number) => Math.round(parseFloat(String(capital)))
  const formatPnl = (pnl: string | number) => {
    const val = parseFloat(String(pnl))
    return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto p-4 md:p-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 14l4-4 4 4 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="9" r="2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent mb-3">
            合约交易统计
          </h1>
          <p className="text-slate-500">记录每一笔交易，分析你的盈亏情况</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 animate-pulse"/>
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"/>
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/80"/>
                </div>
                <span className="text-slate-500 text-sm font-medium">输入交易记录</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入交易记录，如：ETH 2075空 2085止损 2035止盈 90倍 本金15U 止盈"
                className="w-full h-28 bg-slate-950/50 rounded-xl p-4 text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 border border-slate-800 font-mono text-sm"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-slate-600 text-xs">支持多种格式：ETH 2075空 止损2085 止盈2035 90倍</span>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 overflow-hidden group"
                >
                  <span className="relative z-10">{loading ? '提交中...' : '添加记录'}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </div>
            </div>
          </div>
          {message && (
            <div className={`mt-4 p-4 rounded-xl backdrop-blur-sm ${message.type === 'success' ? 'bg-green-500/15 border border-green-500/30 text-green-400' : 'bg-red-500/15 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}
        </form>

        {stats && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                数据概览
              </h2>
              <button
                onClick={handleFixAll}
                disabled={fixing}
                className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-50"
              >
                {fixing ? '修复中...' : '🔧 修复历史数据'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="总交易" value={stats.total} icon="📊" color="text-blue-400"/>
              <StatCard label="胜率" value={`${stats.winRate}%`} icon="🎯" color={stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}/>
              <StatCard label="总盈亏" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}U`} icon={stats.totalPnl >= 0 ? '💰' : '💸'} color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}/>
              <StatCard label="总回报率" value={`${stats.totalRoi >= 0 ? '+' : ''}${stats.totalRoi.toFixed(2)}%`} icon="📈" color={stats.totalRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}/>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatCard label="盈利次数" value={stats.wins} icon="✅" color="text-emerald-400"/>
              <StatCard label="亏损次数" value={stats.losses} icon="❌" color="text-rose-400"/>
              <StatCard label="平均盈利" value={`+${stats.avgWin.toFixed(2)}U`} icon="📈" color="text-emerald-400"/>
              <StatCard label="平均亏损" value={`${stats.avgLoss.toFixed(2)}U`} icon="📉" color="text-rose-400"/>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-5/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-slate-300 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              📋 交易记录
              <span className="text-sm font-normal text-slate-500 ml-2">({trades.length})</span>
            </h2>
            
            {trades.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">📝</span>
                </div>
                <p className="text-slate-500">暂无交易记录，开始记录你的第一笔交易吧</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left py-3 px-3 font-medium text-xs">时间</th>
                      <th className="text-left py-3 px-3 font-medium text-xs">币种</th>
                      <th className="text-center py-3 px-3 font-medium text-xs">方向</th>
                      <th className="text-right py-3 px-3 font-medium text-xs">开仓价</th>
                      <th className="text-right py-3 px-3 font-medium text-xs">止盈</th>
                      <th className="text-right py-3 px-3 font-medium text-xs">止损</th>
                      <th className="text-center py-3 px-3 font-medium text-xs">杠杆</th>
                      <th className="text-right py-3 px-3 font-medium text-xs">本金</th>
                      <th className="text-right py-3 px-3 font-medium text-xs">盈亏</th>
                      <th className="text-right py-3 px-3 font-medium text-xs">回报率</th>
                      <th className="text-center py-3 px-3 font-medium text-xs">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const roi = calculateRoi(trade)
                      return (
                      <tr key={trade.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 text-slate-500 text-xs">{new Date(trade.created_at).toLocaleString('zh-CN')}</td>
                        <td className="py-3 px-3 font-semibold text-white">{trade.symbol}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${trade.direction === 'long' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
                            {trade.direction === 'long' ? '多' : '空'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">{formatPrice(trade.entry_price)}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatPrice(trade.take_profit)}</td>
                        <td className="py-3 px-3 text-right font-mono text-rose-400">{formatPrice(trade.stop_loss)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="bg-violet-500/15 text-violet-400 px-2 py-1 rounded-lg text-xs border border-violet-500/20">{trade.leverage}x</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">{formatCapital(trade.capital)}U</td>
                        <td className={`py-3 px-3 text-right font-bold font-mono ${parseFloat(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPnl(trade.pnl)}U
                        </td>
                        <td className={`py-3 px-3 text-right font-bold font-mono ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => handleDelete(trade.id)} 
                            className="text-slate-600 hover:text-rose-400 transition-colors text-xs px-2 py-1 rounded hover:bg-rose-500/10"
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
        </div>

        <footer className="text-center mt-12 text-slate-600 text-sm">
          <div className="inline-flex items-center gap-2">
            <span>合约交易统计工具</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            <span>数据仅供参考</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color = 'text-white' }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <span className="text-slate-500 text-sm">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
    </div>
  )
}
