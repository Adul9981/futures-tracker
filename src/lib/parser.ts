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
  
  if (!symbol) {
    symbol = 'ETH'
  }
  
  const direction = text.includes('空') ? 'short' : 'long'
  
  let leverage = 10
  const leverageMatch = text.match(/(?:杠杆|倍|leverage)\s*[：:]*\s*(\d+)/i) || text.match(/(\d+)\s*(?:倍|x|×|leverage)/i)
  if (leverageMatch) {
    leverage = parseInt(leverageMatch[1])
  }
  
  let capital = 10
  const capitalMatch = text.match(/(?:本金|保证金|美金|美元)\s*[：:]*\s*(\d+(?:\.\d+)?)/i) || 
                       text.match(/(\d+(?:\.\d+)?)\s*(?:u|usdt|usd)/i) ||
                       text.match(/(\d+(?:\.\d+)?)\s*(?:刀|dollar)/i)
  if (capitalMatch) {
    capital = parseFloat(capitalMatch[1])
  }
  
  let entryPrice = 0
  let stopLoss = 0
  let takeProfit = 0
  
  const entryMatch = text.match(/(?:开仓价?|开(?:多|空)|价格|价|开仓|开)\s*[：:]*\s*(\d+(?:\.\d+)?)/i)
  if (entryMatch) {
    entryPrice = parseFloat(entryMatch[1])
  }
  
  const slMatch = text.match(/(?:止损|sl)\s*[：:]*\s*(\d+(?:\.\d+)?)/i)
  if (slMatch) {
    stopLoss = parseFloat(slMatch[1])
  }
  
  const tpMatch = text.match(/(?:止盈|tp)\s*[：:]*\s*(\d+(?:\.\d+)?)/i)
  if (tpMatch) {
    takeProfit = parseFloat(tpMatch[1])
  }
  
  const allNumbers = text.match(/(\d+(?:\.\d+)?)/g) || []
  
  if (entryPrice === 0 && allNumbers.length > 0) {
    if (symbol && symbol.length < text.length) {
      const symbolIndex = text.indexOf(symbol.toLowerCase())
      if (symbolIndex >= 0) {
        const afterSymbol = text.slice(symbolIndex + symbol.length).replace(/[^\d.]/g, ' ')
        const numMatch = afterSymbol.trim().match(/^(\d+(?:\.\d+)?)/)
        if (numMatch) {
          entryPrice = parseFloat(numMatch[1])
        }
      }
    }
  }
  
  if (entryPrice === 0 && allNumbers.length > 0) {
    for (const num of allNumbers) {
      const numVal = parseFloat(num)
      if (numVal > 100) {
        entryPrice = numVal
        break
      }
    }
  }
  
  const usedPrices: number[] = entryPrice > 0 ? [entryPrice] : []
  
  if (stopLoss === 0) {
    const remaining = allNumbers.filter(n => !usedPrices.includes(parseFloat(n)))
    for (const num of remaining) {
      const numVal = parseFloat(num)
      if (numVal > 100) {
        stopLoss = numVal
        usedPrices.push(stopLoss)
        break
      }
    }
  }
  
  if (takeProfit === 0) {
    const remaining = allNumbers.filter(n => !usedPrices.includes(parseFloat(n)))
    for (const num of remaining) {
      const numVal = parseFloat(num)
      if (numVal > 100) {
        takeProfit = numVal
        break
      }
    }
  }
  
  if (entryPrice === 0) return null
  
  if (stopLoss === 0 && takeProfit > 0) {
    if (direction === 'long') {
      stopLoss = Math.round(entryPrice * 0.98)
    } else {
      stopLoss = Math.round(entryPrice * 1.02)
    }
  }
  
  if (takeProfit === 0 && stopLoss > 0) {
    if (direction === 'long') {
      takeProfit = Math.round(entryPrice * 1.02)
    } else {
      takeProfit = Math.round(entryPrice * 0.98)
    }
  }
  
  if (stopLoss === 0 && takeProfit === 0) {
    if (direction === 'long') {
      takeProfit = Math.round(entryPrice * 1.02)
      stopLoss = Math.round(entryPrice * 0.98)
    } else {
      takeProfit = Math.round(entryPrice * 0.98)
      stopLoss = Math.round(entryPrice * 1.02)
    }
  }
  
  const isWin = text.includes('止盈平仓') || text.includes('止盈') || text.includes('盈利') || 
               text.includes('盈利平仓') || text.includes('tp平仓') || text.includes('tp')
  const isLoss = text.includes('止损平仓') || text.includes('止损') || text.includes('亏损') || 
                text.includes('亏损平仓') || text.includes('爆仓') || text.includes('sl平仓') || text.includes('sl')
  
  const result = isLoss ? 'loss' : (isWin ? 'win' : 'win')
  
  const exitPrice = result === 'win' ? takeProfit : stopLoss
  const pnl = calculatePnl(direction, entryPrice, exitPrice, capital, leverage)
  
  return {
    symbol,
    direction,
    entryPrice: Math.round(entryPrice),
    stopLoss: Math.round(stopLoss),
    takeProfit: Math.round(takeProfit),
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