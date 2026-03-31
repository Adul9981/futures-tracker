import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { parseTrade } from '@/lib/parser'

function calculatePnl(direction: string, entryPrice: number, exitPrice: number, capital: number, leverage: number): number {
  if (exitPrice === 0) return 0
  const priceDiff = direction === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice
  const pnlPercent = (priceDiff / entryPrice) * 100 * leverage
  const pnl = (pnlPercent / 100) * capital
  return Math.round(pnl * 100) / 100
}

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
  }

  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: '缺少交易信息' }, { status: 400 })
    }
    
    const parsed = parseTrade(text)
    
    if (!parsed) {
      return NextResponse.json({ error: '无法解析交易信息' }, { status: 400 })
    }
    
    const result = await sql`
      INSERT INTO trades (symbol, direction, entry_price, stop_loss, take_profit, leverage, capital, result, pnl)
      VALUES (
        ${parsed.symbol},
        ${parsed.direction},
        ${Math.round(parsed.entryPrice)},
        ${Math.round(parsed.stopLoss)},
        ${Math.round(parsed.takeProfit)},
        ${parsed.leverage},
        ${parsed.capital},
        ${parsed.result},
        ${parsed.pnl}
      )
      RETURNING *
    `
    
    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error saving trade:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
  }

  try {
    const trades = await sql`
      SELECT * FROM trades ORDER BY created_at DESC
    `
    
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(SUM(pnl / capital * 100), 0) as total_roi,
        COALESCE(AVG(CASE WHEN result = 'win' THEN pnl END), 0) as avg_win,
        COALESCE(AVG(CASE WHEN result = 'loss' THEN pnl END), 0) as avg_loss,
        COALESCE(MAX(pnl), 0) as max_win,
        COALESCE(MIN(pnl), 0) as max_loss
      FROM trades
    `
    
    return NextResponse.json({
      trades,
      stats: {
        total: Number(stats[0].total),
        wins: Number(stats[0].wins),
        losses: Number(stats[0].losses),
        winRate: stats[0].total > 0 ? Math.round((Number(stats[0].wins) / Number(stats[0].total)) * 100) : 0,
        totalPnl: Number(stats[0].total_pnl),
        totalRoi: Number(stats[0].total_roi),
        avgWin: Number(stats[0].avg_win),
        avgLoss: Number(stats[0].avg_loss),
        maxWin: Number(stats[0].max_win),
        maxLoss: Number(stats[0].max_loss)
      }
    })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
  }

  try {
    const { fixAll } = await request.json()
    
    if (fixAll) {
      const trades = await sql`SELECT * FROM trades`
      
      for (const trade of trades) {
        const exitPrice = trade.result === 'win' ? Number(trade.take_profit) : Number(trade.stop_loss)
        const newPnl = calculatePnl(
          trade.direction,
          Number(trade.entry_price),
          exitPrice,
          Number(trade.capital),
          trade.leverage
        )
        await sql`UPDATE trades SET pnl = ${newPnl} WHERE id = ${trade.id}`
      }
      
      return NextResponse.json({ success: true, message: `已修复 ${trades.length} 条记录` })
    }
    
    return NextResponse.json({ error: '无效请求' }, { status: 400 })
  } catch (error) {
    console.error('Error fixing trades:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: '缺少交易ID' }, { status: 400 })
    }
    
    await sql`DELETE FROM trades WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
