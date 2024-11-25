import React, { useState, useEffect } from 'react';
import { DollarSign, Activity } from 'lucide-react';
import { useRealtimePrice } from '../hooks/useRealtimePrice';
import TradingSignals from './TradingSignals';
import { calculateIndicators } from '../services/signalAnalysis';
import { searchSymbols } from '../services/marketData';
import { useLanguage } from '../context/LanguageContext';

interface MarketCardProps {
  title: string;
  symbol: string;
  icon: React.ElementType;
}

function MarketCard({ title, symbol, icon: Icon }: MarketCardProps) {
  const { price, priceChange, isLive } = useRealtimePrice(symbol);
  const { t } = useLanguage();

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg relative group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">
            ${price.toFixed(2)}
            {!isLive && (
              <span className="ml-2 text-xs text-yellow-500">({t('market.delayed')})</span>
            )}
          </h3>
          <div className="flex items-center mt-2">
            <span className={priceChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <Icon className={`w-6 h-6 ${isLive ? 'text-blue-500' : 'text-gray-500'}`} />
        </div>
      </div>
    </div>
  );
}

export default function MarketStatus() {
  const [strongBuyPairs, setStrongBuyPairs] = useState<Array<{symbol: string, strength: number}>>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const findStrongBuySignals = async () => {
      try {
        const allPairs = await searchSymbols('USDT');
        
        const signals = await Promise.all(
          allPairs.map(async (pair) => {
            try {
              const data = await calculateIndicators(pair.symbol);
              return {
                symbol: pair.symbol,
                signal: data.signal,
                strength: data.strength
              };
            } catch (error) {
              console.error(`Error calculating signals for ${pair.symbol}:`, error);
              return null;
            }
          })
        );

        const strongBuys = signals
          .filter(s => s && s.signal === 'STRONG_BUY')
          .sort((a, b) => (b?.strength || 0) - (a?.strength || 0))
          .slice(0, 4)
          .map(s => ({
            symbol: s!.symbol,
            strength: s!.strength
          }));

        setStrongBuyPairs(strongBuys);
      } catch (error) {
        console.error('Error finding strong buy signals:', error);
      }
    };

    findStrongBuySignals();
    const interval = setInterval(findStrongBuySignals, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('market.overview')}</h2>
        <span className="text-sm text-gray-400">{t('market.showingTopSignals')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {strongBuyPairs.map((pair) => (
          <MarketCard
            key={pair.symbol}
            title={`${pair.symbol.replace('USDT', '')}/USDT`}
            symbol={pair.symbol}
            icon={pair.symbol.includes('BTC') || pair.symbol.includes('ETH') ? DollarSign : Activity}
          />
        ))}
      </div>

      <TradingSignals />
    </div>
  );
}