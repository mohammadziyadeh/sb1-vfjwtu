import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const indicators = [
  { name: 'RSI', value: 65.42, signal: 'Buy', isPositive: true },
  { name: 'MACD', value: 245.12, signal: 'Buy', isPositive: true },
  { name: 'MA(20)', value: 48125, signal: 'Sell', isPositive: false },
];

export default function TechnicalAnalysis() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Technical Analysis</h2>
      <div className="space-y-4">
        {indicators.map((indicator) => (
          <div
            key={indicator.name}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
          >
            <div>
              <p className="text-sm text-gray-400">{indicator.name}</p>
              <p className="text-lg font-medium">{indicator.value}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-medium ${
                  indicator.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {indicator.signal}
              </span>
              {indicator.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}