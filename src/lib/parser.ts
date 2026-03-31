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
  
  let symbol = ''
  const symbolMatch = text.match(/([a-z]{2,10})/i)
  if (symbolMatch) {
    symbol = symbolMatch[1].toUpperCase()
  }
  
  if (!symbol) return null
  
  const direction = text.includes('空') ? 'short' : 'long'
  
  let leverage = 10
  const leverageMatch = text.match(/(?:杠杆|倍|leverage)\s*[：:]*\s*(\d+)/i) || text.match(/(\d+)\s*(?:倍|x|×|leverage)/i)
  if (leverageMatch) {
    leverage = parseInt(leverageMatch[1])
  }
  
  let capital = 10
  const capitalMatch = text.match(/(?:本金|保证金)\s*[：:]*\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:u|usdt)/i)
  if (capitalMatch) {
    capital = parseFloat(capitalMatch[1])
  }
  
  let entryPrice = 0
  const entryMatch = text.match(/(?:开仓价?|开(?:多|空)|价格|价)\s*[：:]*\s*(\d+(?:\.\d+)?)/i)
  if (entryMatch) {
    entryPrice = parseFloat(entryMatch[1])
  }
  
  let stopLoss = 0
  const slMatch = text.match(/(?:止损|sl)\s*[：:]*\s*(\d+(?:\.\d+)?)/i)
  if (slMatch) {
    stopLoss = parseFloat(slMatch[1])
  }
  
  let takeProfit = 0
  const tpMatch = text.match(/(?:止盈|tp)\s*[：:]*\s*(\d+(?:\.\d+)?)/i)
  if (tpMatch) {
    takeProfit = parseFloat(tpMatch[1])
  }
  
  const allNumbers = text.match(/(\d+(?:\.\d+)?)/g) || []
  
  if (entryPrice === 0) {
    const symbolIndex = text.indexOf(symbol.toLowerCase())
    const afterSymbol = text.slice(symbolIndex + symbol.length).replace(/[^\d.]/g, ' ')
    const numMatch = afterSymbol.trim().match(/^(\d+(?:\.\d+)?)/)
    if (numMatch) {
      entryPrice = parseFloat(numMatch[1])
    }
  }
  
  const usedPrices = [entryPrice]
  
  if (stopLoss === 0) {
    const remaining = allNumbers.filter(n => !usedPrices.includes(parseFloat(n)))
    if (remaining.length > 0) {
      stopLoss = parseFloat(remaining[0])
      usedPrices.push(stopLoss)
    }
  }
  
  if (takeProfit === 0) {
    const remaining = allNumbers.filter(n => !usedPrices.includes(parseFloat(n)))
    if (remaining.length > 0) {
      takeProfit = parseFloat(remaining[0])
    }
  }
  
  if (entryPrice === 0) return null
  
  const result = text.includes('止盈') || text.includes('tp') || text.includes('已止盈') ? 'win' : 'loss'
  
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
