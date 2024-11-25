import axios from 'axios';
import { sleep } from '../utils/helpers';

// Create axios instance with optimized settings
const binanceApi = axios.create({
  baseURL: 'https://api.binance.com/api/v3',
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Price cache implementation
const priceCache = new Map<string, {
  price: PriceData;
  timestamp: number;
}>();

const CACHE_DURATION = 1000; // 1 second cache
const BATCH_SIZE = 20; // Number of symbols to fetch in one request

// Rate limiting
const REQUESTS_PER_MINUTE = 1200;
const MINUTE = 60 * 1000;
let requestCount = 0;
let lastResetTime = Date.now();

async function checkRateLimit() {
  const now = Date.now();
  if (now - lastResetTime >= MINUTE) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= REQUESTS_PER_MINUTE) {
    const waitTime = MINUTE - (now - lastResetTime);
    await sleep(waitTime);
    requestCount = 0;
    lastResetTime = Date.now();
  }

  requestCount++;
}

export interface PriceData {
  price: number;
  priceChange: number;
  volume: number;
  high24h?: number;
  low24h?: number;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

// Batch price fetching
async function fetchPriceBatch(symbols: string[]): Promise<Map<string, PriceData>> {
  try {
    await checkRateLimit();
    const response = await binanceApi.get('/ticker/24hr', {
      params: { symbols: JSON.stringify(symbols) }
    });

    const priceMap = new Map<string, PriceData>();
    response.data.forEach((ticker: any) => {
      priceMap.set(ticker.symbol, {
        price: Number(ticker.lastPrice),
        priceChange: Number(ticker.priceChangePercent),
        volume: Number(ticker.volume),
        high24h: Number(ticker.highPrice),
        low24h: Number(ticker.lowPrice)
      });
    });

    return priceMap;
  } catch (error) {
    console.error('Error fetching price batch:', error);
    return new Map();
  }
}

export async function fetchPrice(symbol: string): Promise<PriceData> {
  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    await checkRateLimit();
    const response = await binanceApi.get(`/ticker/24hr`, {
      params: { symbol: symbol.toUpperCase() }
    });
    
    const priceData = {
      price: Number(response.data.lastPrice),
      priceChange: Number(response.data.priceChangePercent),
      volume: Number(response.data.volume),
      high24h: Number(response.data.highPrice),
      low24h: Number(response.data.lowPrice)
    };

    // Update cache
    priceCache.set(symbol, {
      price: priceData,
      timestamp: Date.now()
    });

    return priceData;
  } catch (error) {
    // Return cached data even if expired in case of error
    if (cached) {
      return cached.price;
    }
    
    return {
      price: 0,
      priceChange: 0,
      volume: 0
    };
  }
}

export async function fetchKlines(symbol: string, interval: string): Promise<KlineData[]> {
  try {
    await checkRateLimit();
    const response = await binanceApi.get('/klines', {
      params: {
        symbol: symbol.toUpperCase(),
        interval,
        limit: 500
      }
    });

    return response.data.map((kline: any[]) => ({
      time: Math.floor(kline[0] / 1000),
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
      volume: Number(kline[5])
    }));
  } catch (error) {
    console.error('Error fetching klines:', error);
    return [];
  }
}

export async function getAllSymbols(): Promise<string[]> {
  try {
    await checkRateLimit();
    const response = await binanceApi.get('/exchangeInfo');
    return response.data.symbols
      .filter((s: any) => 
        s.quoteAsset === 'USDT' && 
        s.status === 'TRADING'
      )
      .map((s: any) => s.symbol);
  } catch (error) {
    console.error('Error fetching symbols:', error);
    return [];
  }
}

export async function searchSymbols(query: string): Promise<SymbolInfo[]> {
  try {
    await checkRateLimit();
    const response = await binanceApi.get('/exchangeInfo');
    return response.data.symbols
      .filter((s: any) => 
        s.quoteAsset === 'USDT' && 
        s.status === 'TRADING' &&
        (s.baseAsset.toLowerCase().includes(query.toLowerCase()) ||
         s.symbol.toLowerCase().includes(query.toLowerCase()))
      )
      .map((s: any) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        status: s.status
      }))
      .slice(0, 10);
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
}

// Optimized batch processing for multiple symbols
export async function fetchPricesForSymbols(symbols: string[]): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>();
  const uncachedSymbols: string[] = [];

  // Check cache first
  symbols.forEach(symbol => {
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      result.set(symbol, cached.price);
    } else {
      uncachedSymbols.push(symbol);
    }
  });

  if (uncachedSymbols.length === 0) {
    return result;
  }

  // Fetch uncached symbols in batches
  for (let i = 0; i < uncachedSymbols.length; i += BATCH_SIZE) {
    const batch = uncachedSymbols.slice(i, i + BATCH_SIZE);
    const batchResults = await fetchPriceBatch(batch);
    
    // Update cache and result map
    batchResults.forEach((price, symbol) => {
      priceCache.set(symbol, {
        price,
        timestamp: Date.now()
      });
      result.set(symbol, price);
    });

    if (i + BATCH_SIZE < uncachedSymbols.length) {
      await sleep(100); // Small delay between batches
    }
  }

  return result;
}