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
  avgWin: number
  avgLoss: number
  maxWin: number
  maxLoss: number
}

export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/trades?id=${id}`, { method: 'DELETE' })
      setRefreshKey(k => k + 1)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-center">合约交易统计</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-zinc-800 rounded-lg p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入交易记录，如：ETH 2075空 2085止损 2035止盈 90倍 本金15U 止盈"
              className="w-full h-24 bg-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-zinc-500 text-sm">格式示例：币种 价格方向 开仓价 止损价 止盈价 杠杆 本金 结果</span>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? '提交中...' : '添加记录'}
              </button>
            </div>
          </div>
          {message && (
            <div className={`mt-3 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}
        </form>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="总交易" value={stats.total} />
            <StatCard label="胜率" value={`${stats.winRate}%`} />
            <StatCard label="总盈亏" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl}U`} color={stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'} />
            <StatCard label="最大单笔" value={`${stats.maxWin >= 0 ? '+' : ''}${stats.maxWin}U`} color={stats.maxWin >= 0 ? 'text-green-400' : 'text-red-400'} />
            <StatCard label="盈利次数" value={stats.wins} color="text-green-400" />
            <StatCard label="亏损次数" value={stats.losses} color="text-red-400" />
            <StatCard label="平均盈利" value={`+${stats.avgWin}U`} color="text-green-400" />
            <StatCard label="平均亏损" value={`${stats.avgLoss}U`} color="text-red-400" />
          </div>
        )}

        <div className="bg-zinc-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">交易记录</h2>
          {trades.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">暂无交易记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-700">
                    <th className="text-left py-2 px-2">时间</th>
                    <th className="text-left py-2 px-2">币种</th>
                    <th className="text-left py-2 px-2">方向</th>
                    <th className="text-right py-2 px-2">开仓价</th>
                    <th className="text-right py-2 px-2">止盈</th>
                    <th className="text-right py-2 px-2">止损</th>
                    <th className="text-right py-2 px-2">杠杆</th>
                    <th className="text-right py-2 px-2">本金</th>
                    <th className="text-right py-2 px-2">盈亏</th>
                    <th className="text-center py-2 px-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/50">
                      <td className="py-2 px-2 text-zinc-400">{new Date(trade.created_at).toLocaleString('zh-CN')}</td>
                      <td className="py-2 px-2 font-medium">{trade.symbol}</td>
                      <td className={`py-2 px-2 ${trade.direction === 'long' ? 'text-red-400' : 'text-green-400'}`}>
                        {trade.direction === 'long' ? '多' : '空'}
                      </td>
                      <td className="py-2 px-2 text-right">{trade.entry_price}</td>
                      <td className="py-2 px-2 text-right text-green-400">{trade.take_profit}</td>
                      <td className="py-2 px-2 text-right text-red-400">{trade.stop_loss}</td>
                      <td className="py-2 px-2 text-right">{trade.leverage}x</td>
                      <td className="py-2 px-2 text-right">{trade.capital}U</td>
                      <td className={`py-2 px-2 text-right font-medium ${parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(trade.pnl) >= 0 ? '+' : ''}{trade.pnl}U
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button onClick={() => handleDelete(trade.id)} className="text-zinc-500 hover:text-red-400">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="text-zinc-400 text-sm mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
