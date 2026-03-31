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
  
  const allNumbers = text.match(/(\d+(?:\.\d+)?)/g) || []
  const numbers = allNumbers.map(n => parseFloat(n))
  
  let symbol = ''
  const symbolMatch = text.match(/([a-z]{2,10})/i)
  if (symbolMatch) {
    symbol = symbolMatch[1].toUpperCase()
  }
  
  if (!symbol) return null
  
  const direction = text.includes('空') ? 'short' : 'long'
  
  let entryPrice = 0
  let stopLoss = 0
  let takeProfit = 0
  
  const entryMatch = text.match(/(?:开仓价?|开(?:多|空)|开(?=[a-z]))[\s:：]*(\d+(?:\.\d+)?)/i)
  if (entryMatch) {
    entryPrice = parseFloat(entryMatch[1])
  }
  
  const slMatch = text.match(/(?:止损|sl)[\s:：]*(\d+(?:\.\d+)?)/i)
  if (slMatch) {
    stopLoss = parseFloat(slMatch[1])
  }
  
  const tpMatch = text.match(/(?:止盈|tp)[\s:：]*(\d+(?:\.\d+)?)/i)
  if (tpMatch) {
    takeProfit = parseFloat(tpMatch[1])
  }
  
  if (entryPrice === 0 && numbers.length >= 1) {
    const symbolIndex = text.indexOf(symbol.toLowerCase())
    const afterSymbol = text.slice(symbolIndex + symbol.length)
    const firstNumMatch = afterSymbol.match(/(\d+(?:\.\d+)?)/)
    if (firstNumMatch) {
      entryPrice = parseFloat(firstNumMatch[1])
    }
  }
  
  if (stopLoss === 0 && numbers.length >= 2) {
    const remaining = allNumbers.filter(n => parseFloat(n) !== entryPrice)
    if (remaining.length >= 1) {
      stopLoss = parseFloat(remaining[0])
    }
  }
  
  if (takeProfit === 0 && numbers.length >= 3) {
    const remaining = allNumbers.filter(n => parseFloat(n) !== entryPrice && parseFloat(n) !== stopLoss)
    if (remaining.length >= 1) {
      takeProfit = parseFloat(remaining[0])
    }
  }
  
  if (entryPrice === 0) return null
  
  const leverageMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:倍|x|×)/)
  const leverage = leverageMatch ? parseFloat(leverageMatch[1]) : 10
  
  const capitalMatch = text.match(/(?:本金|保证金|开)\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:u|usdt)/i)
  const capital = capitalMatch ? parseFloat(capitalMatch[1]) : 10
  
  const result = text.includes('止盈') || text.includes('tp') ? 'win' : 'loss'
  
  const exitPrice = result === 'win' ? takeProfit : stopLoss
  const pnl = calculatePnl(direction, entryPrice, exitPrice, capital, leverage)
  
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
  if (exitPrice === 0) return 0
  
  const priceDiff = direction === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice
  
  const pnlPercent = (priceDiff / entryPrice) * 100 * leverage
  const pnl = (pnlPercent / 100) * capital
  
  return Math.round(pnl * 100) / 100
}
