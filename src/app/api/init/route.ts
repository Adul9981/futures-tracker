import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  if (!sql) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        entry_price DECIMAL(20, 8) NOT NULL,
        stop_loss DECIMAL(20, 8) NOT NULL,
        take_profit DECIMAL(20, 8) NOT NULL,
        leverage INTEGER NOT NULL,
        capital DECIMAL(20, 8) NOT NULL,
        result VARCHAR(20) NOT NULL,
        pnl DECIMAL(20, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    return NextResponse.json({ success: true, message: '数据库表已初始化' })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ error: '数据库初始化失败' }, { status: 500 })
  }
}
