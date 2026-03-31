interface ParsedTrade {
  symbol: string
  direction: 'long' | 'short'
  entryPrice: number
  stopLoss: number
  takeProfit: number
  leverage: number
  capital: number
  result: 'win' | 'loss'
  pnl: number
}

export function parseTrade(input: string): ParsedTrade | null {
  const text = input.toLowerCase().trim()
  
  const symbolMatch = text.match(/([a-z]+)\s*(\d+)/i)
  if (!symbolMatch) return null
  const symbol = symbolMatch[1].toUpperCase()
  
  const direction = text.includes('空') ? 'short' : 'long'
  
  const priceMatch = text.match(/(\d+(?:\.\d+)?)/g)
  if (!priceMatch || priceMatch.length < 3) return null
  
  const leverageMatch = text.match(/(\d+)\s*(?:倍|x)/)
  const leverage = leverageMatch ? parseInt(leverageMatch[1]) : 1
  
  const capitalMatch = text.match(/(?:本金|保证金)\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:u|usdt)/i)
  const capital = capitalMatch ? parseFloat(capitalMatch[1]) : 0
  
  const result = text.includes('止盈') ? 'win' : 'loss'
  
  const entryPrice = parseFloat(priceMatch[0])
  const stopLoss = parseFloat(priceMatch[1])
  const takeProfit = parseFloat(priceMatch[2])
  
  const pnl = calculatePnl(direction, entryPrice, result === 'win' ? takeProfit : stopLoss, capital, leverage)
  
  return {
    symbol,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    leverage,
    capital,
    result,
    pnl
  }
}

function calculatePnl(
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  capital: number,
  leverage: number
): number {
  const priceDiff = direction === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice
  
  const pnlPercent = (priceDiff / entryPrice) * 100 * leverage
  const pnl = (pnlPercent / 100) * capital
  
  return Math.round(pnl * 100) / 100
}
