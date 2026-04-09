'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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

interface DirectionStats {
  total: number
  wins: number
  winRate: number
  totalPnl: number
}

interface SymbolStats {
  symbol: string
  total: number
  wins: number
  winRate: number
  totalPnl: number
}

interface ApiResponse {
  trades: Trade[]
  stats: Stats
  longStats: DirectionStats
  shortStats: DirectionStats
  symbolStats: SymbolStats[]
  pnlCurve: { date: string; pnl: number }[]
  allSymbols: string[]
}

export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [longStats, setLongStats] = useState<DirectionStats | null>(null)
  const [shortStats, setShortStats] = useState<DirectionStats | null>(null)
  const [symbolStats, setSymbolStats] = useState<SymbolStats[]>([])
  const [pnlCurve, setPnlCurve] = useState<{ date: string; pnl: number }[]>([])
  const [allSymbols, setAllSymbols] = useState<string[]>([])
  const [period, setPeriod] = useState('all')
  const [symbolFilter, setSymbolFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchPreview, setBatchPreview] = useState<{
    symbol: string
    direction: 'long' | 'short'
    entryPrice: string
    stopLoss: string
    takeProfit: string
    leverage: string
    capital: string
    result: 'win' | 'loss'
  }[]>([])
  const [previewData, setPreviewData] = useState<{
    symbol: string
    direction: 'long' | 'short'
    entryPrice: string
    stopLoss: string
    takeProfit: string
    leverage: string
    capital: string
    result: 'win' | 'loss'
  } | null>(null)
  const [parseErrors, setParseErrors] = useState<{ field: string; message: string }[]>([])
  const [templates, setTemplates] = useState<string[]>([])
  const [suggestedTemplate, setSuggestedTemplate] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const url = `/api/trades?period=${period}&symbol=${symbolFilter}`
      const res = await fetch(url)
      const data: ApiResponse = await res.json()
      if (data.trades) setTrades(data.trades)
      if (data.stats) setStats(data.stats)
      if (data.longStats) setLongStats(data.longStats)
      if (data.shortStats) setShortStats(data.shortStats)
      if (data.symbolStats) setSymbolStats(data.symbolStats)
      if (data.pnlCurve) setPnlCurve(data.pnlCurve)
      if (data.allSymbols) setAllSymbols(data.allSymbols)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  useEffect(() => {
    fetchData()
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradeInputHistory')
      if (saved) {
        setInputHistory(JSON.parse(saved))
      }
      const savedTemplates = localStorage.getItem('tradeTemplates')
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates))
      }
    }
  }, [refreshKey, period, symbolFilter])

  const { extractTemplate } = require('@/lib/parser')

  const handlePreview = () => {
    if (!input.trim()) return
    
    const { parseTradeWithValidation, parseMultipleTrades, extractTemplate } = require('@/lib/parser')
    
    const template = extractTemplate(input)
    if (template.length > 5) {
      setSuggestedTemplate(template)
    }
    
    if (isBatchMode) {
      const result = parseMultipleTrades(input)
      if (result.success.length > 0) {
        setBatchPreview(result.success.map((p: any) => ({
          symbol: p.symbol,
          direction: p.direction,
          entryPrice: String(p.entryPrice),
          stopLoss: String(p.stopLoss),
          takeProfit: String(p.takeProfit),
          leverage: String(p.leverage),
          capital: String(p.capital),
          result: p.result
        })))
        setParseErrors(result.failed.map(f => ({ field: '', message: `${f.text}: ${f.error}` })))
        setShowPreview(true)
      }
      if (result.failed.length > 0 && result.success.length === 0) {
        setMessage({ type: 'error', text: result.failed[0].error })
        setParseErrors(result.failed.map(f => ({ field: '', message: `${f.text}: ${f.error}` })))
      }
      return
    }
    
    const result = parseTradeWithValidation(input)
    
    if (result.success && result.data) {
      setPreviewData({
        symbol: result.data.symbol,
        direction: result.data.direction,
        entryPrice: String(result.data.entryPrice),
        stopLoss: String(result.data.stopLoss),
        takeProfit: String(result.data.takeProfit),
        leverage: String(result.data.leverage),
        capital: String(result.data.capital),
        result: result.data.result
      })
      setParseErrors(result.errors || [])
      setShowPreview(true)
    } else {
      setMessage({ type: 'error', text: result.errors?.[0]?.message || '无法解析交易信息' })
      setParseErrors(result.errors || [])
    }
  }

  const handleConfirmSave = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      if (isBatchMode && batchPreview.length > 0) {
        let successCount = 0
        for (const p of batchPreview) {
          const text = `${p.symbol} ${p.entryPrice}${p.direction === 'short' ? '空' : '多'} 止损${p.stopLoss} 止盈${p.takeProfit} ${p.leverage}倍 本金${p.capital}U ${p.result === 'win' ? '止盈' : '止损'}`
          await fetch('/api/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          })
          successCount++
        }
        setMessage({ type: 'success', text: `成功保存 ${successCount} 笔交易` })
        setInput('')
        setRefreshKey(k => k + 1)
      } else if (previewData) {
        const text = `${previewData.symbol} ${previewData.entryPrice}${previewData.direction === 'short' ? '空' : '多'} 止损${previewData.stopLoss} 止盈${previewData.takeProfit} ${previewData.leverage}倍 本金${previewData.capital}U ${previewData.result === 'win' ? '止盈' : '止损'}`
        
        const res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })

        const data = await res.json()

        if (!res.ok) {
          setMessage({ type: 'error', text: data.error })
        } else {
          setMessage({ type: 'success', text: '交易记录已保存' })
          setInput('')
          setRefreshKey(k => k + 1)
          setInputHistory(prev => {
            const newHistory = [input, ...prev.filter(h => h !== input)].slice(0, 10)
            if (typeof window !== 'undefined') {
              localStorage.setItem('tradeInputHistory', JSON.stringify(newHistory))
            }
            return newHistory
          })
          if (suggestedTemplate) {
            setTemplates(prev => {
              const newTemplates = [suggestedTemplate, ...prev.filter(t => t !== suggestedTemplate)].slice(0, 5)
              if (typeof window !== 'undefined') {
                localStorage.setItem('tradeTemplates', JSON.stringify(newTemplates))
              }
              return newTemplates
            })
            setSuggestedTemplate(null)
          }
        }
      }
    } catch {
      setMessage({ type: 'error', text: '提交失败，请重试' })
    } finally {
      setLoading(false)
      setShowPreview(false)
      setPreviewData(null)
    }
  }

  const handleCancelPreview = () => {
    setShowPreview(false)
    setPreviewData(null)
  }

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
      </div>
      
      <div className="relative max-w-6xl mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 14l4-4 4 4 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="9" r="2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent mb-2">
            合约交易统计
          </h1>
          <p className="text-slate-500 text-sm">记录每一笔交易，分析你的盈亏情况</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"/>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"/>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"/>
                  </div>
                  <span className="text-slate-500 text-sm font-medium">输入交易记录</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsBatchMode(!isBatchMode); setInput('') }}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${isBatchMode ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-500'}`}
                >
                  {isBatchMode ? '📚 批量模式' : '📝 单笔模式'}
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isBatchMode ? "批量输入，每行一笔：\nETH 2075空 止损2085 止盈2035 90倍 本金15U 止盈\nBTC 95000多 止损94000 止盈96000 50倍 本金20U 止盈" : "输入交易记录，如：ETH 2075空 2085止损 2035止盈 90倍 本金15U 止盈"}
                className={`w-full bg-slate-950/50 rounded-xl p-3 text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 border border-slate-800 font-mono text-sm ${isBatchMode ? 'h-40' : 'h-24'}`}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-slate-600 text-xs">支持多种格式</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!input.trim() || loading}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                  >
                    预览
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                  >
                    {loading ? '提交中...' : '直接添加'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {message && (
            <div className={`mt-3 p-3 rounded-xl backdrop-blur-sm text-sm ${message.type === 'success' ? 'bg-green-500/15 border border-green-500/30 text-green-400' : 'bg-red-500/15 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}
        </form>

        {showPreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-yellow-400">👁️</span>
                {isBatchMode ? `确认 ${batchPreview.length} 笔交易` : '确认交易信息'}
              </h3>
              
              {isBatchMode ? (
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {batchPreview.map((p, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">{p.symbol}</span>
                        <span className={p.direction === 'short' ? 'text-emerald-400' : 'text-rose-400'}>
                          {p.direction === 'short' ? '空' : '多'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs flex justify-between">
                        <span>开仓: {p.entryPrice} | 止盈: {p.takeProfit} | 止损: {p.stopLoss}</span>
                        <span className={p.result === 'win' ? 'text-emerald-400' : 'text-rose-400'}>
                          {p.result === 'win' ? '盈利' : '亏损'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : previewData && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">币种</span>
                    <input type="text" value={previewData.symbol} onChange={(e) => setPreviewData({...previewData, symbol: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">方向</span>
                    <select value={previewData.direction} onChange={(e) => setPreviewData({...previewData, direction: e.target.value as 'long' | 'short'})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right">
                      <option value="long">多</option>
                      <option value="short">空</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">开仓价</span>
                    <input type="number" value={previewData.entryPrice} onChange={(e) => setPreviewData({...previewData, entryPrice: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">止盈</span>
                    <input type="number" value={previewData.takeProfit} onChange={(e) => setPreviewData({...previewData, takeProfit: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">止损</span>
                    <input type="number" value={previewData.stopLoss} onChange={(e) => setPreviewData({...previewData, stopLoss: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">杠杆</span>
                    <input type="number" value={previewData.leverage} onChange={(e) => setPreviewData({...previewData, leverage: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">本金</span>
                    <input type="number" value={previewData.capital} onChange={(e) => setPreviewData({...previewData, capital: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right w-24" />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">结果</span>
                    <select value={previewData.result} onChange={(e) => setPreviewData({...previewData, result: e.target.value as 'win' | 'loss'})} className={`bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-right ${previewData.result === 'win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <option value="win">盈利</option>
                      <option value="loss">亏损</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button onClick={() => { setShowPreview(false); setPreviewData(null); setBatchPreview([]) }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors">
                  取消
                </button>
                <button onClick={handleConfirmSave} disabled={loading} className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {loading ? '保存中...' : '确认保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {inputHistory.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <span>📜</span> 历史输入 ({inputHistory.length})
            </button>
            {showHistory && (
              <div className="mt-2 flex flex-wrap gap-2">
                {inputHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(h)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 truncate max-w-xs"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {parseErrors.length > 0 && !showPreview && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="text-amber-400 text-sm font-medium mb-2">⚠️ 解析提示</div>
            {parseErrors.map((err, i) => (
              <div key={i} className="text-amber-300/80 text-xs mb-1">{err.message}</div>
            ))}
          </div>
        )}

        {templates.length > 0 && (
          <div className="mb-6">
            <div className="text-sm text-slate-500 mb-2">📋 常用格式</div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setMessage({ type: 'success', text: `常用格式 ${i + 1} 已记忆` })}
                  className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-lg hover:bg-violet-500/20"
                >
                  格式 {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
          
          <select 
            value={symbolFilter} 
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">全部币种</option>
            {allSymbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          
          <button
            onClick={handleFixAll}
            disabled={fixing}
            className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl hover:bg-amber-500/20 transition-all disabled:opacity-50"
          >
            {fixing ? '修复中...' : '🔧 修复历史数据'}
          </button>
        </div>

        {stats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              数据概览
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="总交易" value={stats.total} icon="📊" color="text-blue-400"/>
              <StatCard label="胜率" value={`${stats.winRate}%`} icon="🎯" color={stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}/>
              <StatCard label="总盈亏" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}U`} icon={stats.totalPnl >= 0 ? '💰' : '💸'} color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}/>
              <StatCard label="总回报率" value={`${stats.totalRoi >= 0 ? '+' : ''}${stats.totalRoi.toFixed(2)}%`} icon="📈" color={stats.totalRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}/>
            </div>
          </div>
        )}

        {longStats && shortStats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              多空统计
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-rose-400">🔴</span>
                  <span className="text-slate-400 text-sm">多头</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs">交易次数</div>
                    <div className="font-semibold">{longStats.total}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">胜率</div>
                    <div className={`font-semibold ${longStats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{longStats.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">盈亏</div>
                    <div className={`font-semibold ${longStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {longStats.totalPnl >= 0 ? '+' : ''}{longStats.totalPnl.toFixed(2)}U
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">🟢</span>
                  <span className="text-slate-400 text-sm">空头</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs">交易次数</div>
                    <div className="font-semibold">{shortStats.total}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">胜率</div>
                    <div className={`font-semibold ${shortStats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{shortStats.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">盈亏</div>
                    <div className={`font-semibold ${shortStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {shortStats.totalPnl >= 0 ? '+' : ''}{shortStats.totalPnl.toFixed(2)}U
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {pnlCurve.length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              盈亏曲线
            </h2>
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlCurve}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}U`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${Number(value).toFixed(2)}U`, '累计盈亏']}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#10b981" 
                    fill="url(#pnlGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {symbolStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              交易对分析
            </h2>
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-3 px-4 font-medium text-xs">币种</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">交易次数</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">胜率</th>
                    <th className="text-right py-3 px-4 font-medium text-xs">总盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {symbolStats.map((s) => (
                    <tr key={s.symbol} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold">{s.symbol}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{s.total}</td>
                      <td className={`py-3 px-4 text-right ${s.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{s.winRate}%</td>
                      <td className={`py-3 px-4 text-right font-semibold ${s.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {s.totalPnl >= 0 ? '+' : ''}{s.totalPnl.toFixed(2)}U
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-5/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4 text-slate-300 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
              📋 交易记录
              <span className="text-sm font-normal text-slate-500 ml-2">({trades.length})</span>
            </h2>
            
            {trades.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📝</span>
                </div>
                <p className="text-slate-500 text-sm">暂无交易记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left py-2 px-3 font-medium text-xs">时间</th>
                      <th className="text-left py-2 px-3 font-medium text-xs">币种</th>
                      <th className="text-center py-2 px-3 font-medium text-xs">方向</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">开仓价</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">止盈</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">止损</th>
                      <th className="text-center py-2 px-3 font-medium text-xs">杠杆</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">本金</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">盈亏</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">回报率</th>
                      <th className="text-center py-2 px-3 font-medium text-xs">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const roi = calculateRoi(trade)
                      return (
                      <tr key={trade.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-3 text-slate-500 text-xs">{new Date(trade.created_at).toLocaleString('zh-CN')}</td>
                        <td className="py-2 px-3 font-semibold text-white">{trade.symbol}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${trade.direction === 'long' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
                            {trade.direction === 'long' ? '多' : '空'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300 text-xs">{formatPrice(trade.entry_price)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-400 text-xs">{formatPrice(trade.take_profit)}</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-400 text-xs">{formatPrice(trade.stop_loss)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-lg text-xs border border-violet-500/20">{trade.leverage}x</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300 text-xs">{formatCapital(trade.capital)}U</td>
                        <td className={`py-2 px-3 text-right font-bold font-mono text-xs ${parseFloat(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPnl(trade.pnl)}U
                        </td>
                        <td className={`py-2 px-3 text-right font-bold font-mono text-xs ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-center">
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

        <footer className="text-center mt-10 text-slate-600 text-sm">
          合约交易统计工具 · 数据仅供参考
        </footer>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color = 'text-white' }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-slate-500 text-xs">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
