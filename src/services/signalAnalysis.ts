import { fetchKlines } from './marketData';

interface SignalData {
  adx: number;
  rsi: number;
  ema50: number;
  ema200: number;
  signal: 'STRONG_BUY' | 'STRONG_SELL' | 'NEUTRAL';
  strength: number;
}

export async function calculateIndicators(symbol: string): Promise<SignalData> {
  try {
    const klines = await fetchKlines(symbol, '15m');
    if (!klines || klines.length < 200) {
      return getDefaultSignalData();
    }

    const prices = klines.map(k => k.close);
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);

    // Calculate indicators with error handling
    const currentADX = calculateADX(highs, lows, prices);
    const currentRSI = calculateRSI(prices);
    const currentEMA50 = calculateEMA(prices, 50);
    const currentEMA200 = calculateEMA(prices, 200);

    // Validate calculated values
    if (!isValidNumber(currentADX) || !isValidNumber(currentRSI) || 
        !isValidNumber(currentEMA50) || !isValidNumber(currentEMA200)) {
      return getDefaultSignalData();
    }

    // Determine signal
    const signal = determineSignal(currentADX, currentRSI, prices[prices.length - 1], currentEMA50, currentEMA200);
    const strength = calculateSignalStrength({
      adx: currentADX,
      rsi: currentRSI,
      priceVsEma50: ((prices[prices.length - 1] / currentEMA50) - 1) * 100,
      emaAlignment: currentEMA50 > currentEMA200
    });

    return {
      adx: currentADX,
      rsi: currentRSI,
      ema50: currentEMA50,
      ema200: currentEMA200,
      signal,
      strength
    };
  } catch (error) {
    console.error(`Error calculating indicators for ${symbol}:`, error);
    return getDefaultSignalData();
  }
}

function getDefaultSignalData(): SignalData {
  return {
    adx: 0,
    rsi: 50,
    ema50: 0,
    ema200: 0,
    signal: 'NEUTRAL',
    strength: 0
  };
}

function isValidNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function calculateRSI(prices: number[], period: number = 14): number {
  try {
    if (prices.length < period + 1) {
      return 50;
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI using Wilder's smoothing method
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }

    if (avgLoss === 0) {
      return 100;
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return 50;
  }
}

function calculateEMA(prices: number[], period: number): number {
  try {
    if (prices.length < period) {
      return 0;
    }

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  } catch (error) {
    console.error('Error calculating EMA:', error);
    return 0;
  }
}

function calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  try {
    if (highs.length < period * 2) {
      return 0;
    }

    const tr = getTrueRange(highs, lows, closes);
    const plusDM = getPlusDM(highs);
    const minusDM = getMinusDM(lows);

    let sumTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let sumPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let sumMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

    let plusDI = (sumPlusDM / sumTR) * 100;
    let minusDI = (sumMinusDM / sumTR) * 100;
    let dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;

    // Calculate ADX
    let adx = dx;
    for (let i = period; i < tr.length; i++) {
      sumTR = sumTR - tr[i - period] + tr[i];
      sumPlusDM = sumPlusDM - plusDM[i - period] + plusDM[i];
      sumMinusDM = sumMinusDM - minusDM[i - period] + minusDM[i];

      plusDI = (sumPlusDM / sumTR) * 100;
      minusDI = (sumMinusDM / sumTR) * 100;
      dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
      adx = ((adx * (period - 1)) + dx) / period;
    }

    return adx;
  } catch (error) {
    console.error('Error calculating ADX:', error);
    return 0;
  }
}

function getTrueRange(highs: number[], lows: number[], closes: number[]): number[] {
  try {
    return highs.map((high, i) => {
      if (i === 0) return high - lows[i];
      const hl = high - lows[i];
      const hc = Math.abs(high - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      return Math.max(hl, hc, lc);
    });
  } catch (error) {
    console.error('Error calculating True Range:', error);
    return [];
  }
}

function getPlusDM(highs: number[]): number[] {
  try {
    return highs.map((high, i) => {
      if (i === 0) return 0;
      const diff = high - highs[i - 1];
      return diff > 0 ? diff : 0;
    });
  } catch (error) {
    console.error('Error calculating Plus DM:', error);
    return [];
  }
}

function getMinusDM(lows: number[]): number[] {
  try {
    return lows.map((low, i) => {
      if (i === 0) return 0;
      const diff = lows[i - 1] - low;
      return diff > 0 ? diff : 0;
    });
  } catch (error) {
    console.error('Error calculating Minus DM:', error);
    return [];
  }
}

function determineSignal(
  adx: number,
  rsi: number,
  currentPrice: number,
  ema50: number,
  ema200: number
): SignalData['signal'] {
  try {
    if (adx > 25) {
      if (rsi > 50 && currentPrice > ema50 && ema50 > ema200) {
        return 'STRONG_BUY';
      } else if (rsi > 70 && currentPrice < ema50 && ema50 < ema200) {
        return 'STRONG_SELL';
      }
    }
    return 'NEUTRAL';
  } catch (error) {
    console.error('Error determining signal:', error);
    return 'NEUTRAL';
  }
}

interface SignalStrengthParams {
  adx: number;
  rsi: number;
  priceVsEma50: number;
  emaAlignment: boolean;
}

function calculateSignalStrength(params: SignalStrengthParams): number {
  try {
    let strength = 0;

    // ADX contribution (max 30 points)
    strength += Math.min(params.adx / 2, 30);

    // RSI contribution (max 25 points)
    if (params.rsi >= 70 || params.rsi <= 30) {
      strength += 25;
    } else if (params.rsi >= 60 || params.rsi <= 40) {
      strength += 15;
    }

    // Price vs EMA50 contribution (max 25 points)
    const priceEmaGap = Math.abs(params.priceVsEma50);
    strength += Math.min(priceEmaGap * 5, 25);

    // EMA alignment contribution (20 points)
    if (params.emaAlignment) {
      strength += 20;
    }

    return Math.min(Math.max(0, strength), 100);
  } catch (error) {
    console.error('Error calculating signal strength:', error);
    return 0;
  }
}