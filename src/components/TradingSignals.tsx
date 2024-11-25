import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRealtimePrice } from '../hooks/useRealtimePrice';
import { calculateIndicators } from '../services/signalAnalysis';
import { searchSymbols } from '../services/marketData';
import { useLanguage } from '../context/LanguageContext';

interface SignalRowProps {
  symbol: string;
  onRemove: (symbol: string) => void;
}

function SignalRow({ symbol, onRemove }: SignalRowProps) {
  const { price, priceChange, isLive } = useRealtimePrice(symbol);
  const [indicators, setIndicators] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const data = await calculateIndicators(symbol);
        setIndicators(data);
      } catch (error) {
        console.error(`Error fetching indicators for ${symbol}:`, error);
      }
    };

    fetchIndicators();
    const interval = setInterval(fetchIndicators, 15000);
    return () => clearInterval(interval);
  }, [symbol]);

  function getADXColor(adx: number): string {
    if (adx >= 50) return 'text-green-500';
    if (adx >= 25) return 'text-blue-500';
    return 'text-gray-400';
  }

  function getRSIColor(rsi: number): string {
    if (rsi >= 70) return 'text-red-500';
    if (rsi <= 30) return 'text-green-500';
    return 'text-gray-400';
  }

  function getSignalColor(signal: string): string {
    switch (signal) {
      case 'STRONG_BUY':
        return 'text-green-500';
      case 'STRONG_SELL':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  }

  if (!indicators) {
    return null;
  }

  return (
    <tr className="border-b border-gray-700">
      <td className="py-4 px-4">{symbol}</td>
      <td className="py-4 px-4">
        <span className="font-mono">${price.toFixed(8)}</span>
        {!isLive && <span className="ml-2 text-xs text-yellow-500">({t('market.delayed')})</span>}
      </td>
      <td className={`py-4 px-4 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {priceChange.toFixed(2)}%
      </td>
      <td className={`py-4 px-4 ${getADXColor(indicators.adx)}`}>
        {indicators.adx.toFixed(2)}
      </td>
      <td className={`py-4 px-4 ${getRSIColor(indicators.rsi)}`}>
        {indicators.rsi.toFixed(2)}
      </td>
      <td className="py-4 px-4">
        {indicators.ema50.toFixed(2)}
      </td>
      <td className="py-4 px-4">
        {indicators.ema200.toFixed(2)}
      </td>
      <td className={`py-4 px-4 ${getSignalColor(indicators.signal)}`}>
        {t(`signals.${indicators.signal}`)}
      </td>
      <td className="py-4 px-4">
        {indicators.strength}%
      </td>
      <td className="py-4 px-4">
        <button
          onClick={() => onRemove(symbol)}
          className="text-red-500 hover:text-red-400"
        >
          <X className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

export default function TradingSignals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    const saved = localStorage.getItem('selectedSymbols');
    return saved ? JSON.parse(saved) : [];
  });
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem('selectedSymbols', JSON.stringify(selectedSymbols));
  }, [selectedSymbols]);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchSymbols(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching symbols:', error);
      setSearchResults([]);
    }
  };

  const addSymbol = (symbol: string) => {
    if (!selectedSymbols.includes(symbol)) {
      setSelectedSymbols(prev => [...prev, symbol]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeSymbol = (symbol: string) => {
    setSelectedSymbols(prev => prev.filter(s => s !== symbol));
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('market.tradingSignals')}</h2>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder={t('market.searchPairs')}
              className="w-64 pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute mt-2 w-full bg-gray-700 rounded-lg shadow-lg z-10">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => addSymbol(result.symbol)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                >
                  {result.symbol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="py-3 px-4">{t('market.symbol')}</th>
              <th className="py-3 px-4">{t('market.price')}</th>
              <th className="py-3 px-4">{t('market.change24h')}</th>
              <th className="py-3 px-4">{t('market.adx')}</th>
              <th className="py-3 px-4">{t('market.rsi')}</th>
              <th className="py-3 px-4">{t('market.ema50')}</th>
              <th className="py-3 px-4">{t('market.ema200')}</th>
              <th className="py-3 px-4">{t('market.signal')}</th>
              <th className="py-3 px-4">{t('market.strength')}</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {selectedSymbols.map((symbol) => (
              <SignalRow
                key={symbol}
                symbol={symbol}
                onRemove={removeSymbol}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}