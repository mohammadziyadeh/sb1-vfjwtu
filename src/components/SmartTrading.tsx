import React, { useState, useEffect } from 'react';
import { Brain, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateIndicators } from '../services/signalAnalysis';
import { getAllSymbols } from '../services/marketData';
import { useRealtimePrice } from '../hooks/useRealtimePrice';

interface SignalData {
  symbol: string;
  adx: number;
  rsi: number;
  ema50: number;
  ema200: number;
  signal: string;
  strength: number;
}

interface SignalRowProps {
  signal: SignalData;
}

interface SortConfig {
  key: keyof SignalData | 'price' | 'priceChange';
  direction: 'asc' | 'desc';
}

function SignalRow({ signal }: SignalRowProps) {
  const { price, priceChange, isLive } = useRealtimePrice(signal.symbol);
  const { t } = useLanguage();

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
      <td className="py-4 px-2 md:px-4 whitespace-nowrap">{signal.symbol}</td>
      <td className="py-4 px-2 md:px-4 font-mono whitespace-nowrap">
        <div className="flex items-center">
          <span>${price > 0 ? price.toFixed(8) : '---'}</span>
          {!isLive && (
            <span className="ml-2 text-xs text-yellow-500 hidden sm:inline">
              ({t('market.delayed')})
            </span>
          )}
        </div>
      </td>
      <td className={`py-4 px-2 md:px-4 whitespace-nowrap ${
        price > 0 ? (priceChange >= 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400'
      }`}>
        {price > 0 ? `${priceChange.toFixed(2)}%` : '---'}
      </td>
      <td className="py-4 px-2 md:px-4 whitespace-nowrap hidden lg:table-cell">
        {signal.adx.toFixed(2)}
      </td>
      <td className="py-4 px-2 md:px-4 whitespace-nowrap hidden lg:table-cell">
        {signal.rsi.toFixed(2)}
      </td>
      <td className="py-4 px-2 md:px-4 whitespace-nowrap hidden xl:table-cell">
        {signal.ema50.toFixed(2)}
      </td>
      <td className="py-4 px-2 md:px-4 whitespace-nowrap hidden xl:table-cell">
        {signal.ema200.toFixed(2)}
      </td>
      <td className="py-4 px-2 md:px-4 whitespace-nowrap text-green-500">
        {t(`signals.${signal.signal}`)}
      </td>
      <td className="py-4 px-2 md:px-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-16 md:w-24 bg-gray-700 rounded-full h-2 mr-2">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${signal.strength}%` }}
            />
          </div>
          <span className="min-w-[40px]">{signal.strength}%</span>
        </div>
      </td>
    </tr>
  );
}

function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  onSort 
}: { 
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: any) => void;
}) {
  return (
    <th 
      className="py-3 px-2 md:px-4 whitespace-nowrap cursor-pointer group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown 
          className={`w-4 h-4 transition-opacity ${
            currentSort.key === sortKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
          } ${
            currentSort.key === sortKey && currentSort.direction === 'desc' ? 'transform rotate-180' : ''
          }`}
        />
      </div>
    </th>
  );
}

function SmartTrading() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'strength',
    direction: 'desc'
  });
  const { t } = useLanguage();

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const allSymbols = await getAllSymbols();
        const signalPromises = allSymbols.map(async (symbol) => {
          try {
            const data = await calculateIndicators(symbol);
            return {
              symbol,
              ...data
            };
          } catch (error) {
            console.error(`Error calculating signals for ${symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(signalPromises);
        const validSignals = results
          .filter((signal): signal is SignalData => 
            signal !== null && 
            signal.signal === 'STRONG_BUY' &&
            signal.strength >= 70
          )
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 25);

        setSignals(validSignals);
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleSort = (key: keyof SignalData | 'price' | 'priceChange') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedSignals = [...signals].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const aValue = a[sortConfig.key as keyof SignalData];
    const bValue = b[sortConfig.key as keyof SignalData];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction * aValue.localeCompare(bValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction * (aValue - bValue);
    }
    
    return 0;
  });

  return (
    <div className="space-y-6 px-2 sm:px-6">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Brain className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{t('smartTrading.title')}</h2>
              <p className="text-sm text-gray-400">{t('market.showingTopSignals')}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:-mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <SortableHeader
                      label={t('market.symbol')}
                      sortKey="symbol"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.price')}
                      sortKey="price"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.change24h')}
                      sortKey="priceChange"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.adx')}
                      sortKey="adx"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.rsi')}
                      sortKey="rsi"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.ema50')}
                      sortKey="ema50"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.ema200')}
                      sortKey="ema200"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.signal')}
                      sortKey="signal"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label={t('market.strength')}
                      sortKey="strength"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedSignals.map((signal) => (
                    <SignalRow key={signal.symbol} signal={signal} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartTrading;