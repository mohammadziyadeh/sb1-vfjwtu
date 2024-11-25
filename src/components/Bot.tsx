import React, { useState } from 'react';
import { Bot as BotIcon, Settings, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Power } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BotSettings {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  symbol: string;
  tradeAmount: string;
  profitMargin: string;
  exchangeFee: string;
  enhancementPercentage: string;
  enhancementAmount: string;
  maxEnhancements: string;
  stopLoss: string;
  reinvestProfits: boolean;
  manualMode: boolean;
}

export default function Bot() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<BotSettings>({
    exchange: 'binance',
    apiKey: '',
    apiSecret: '',
    symbol: '',
    tradeAmount: '',
    profitMargin: '2',
    exchangeFee: '0.1',
    enhancementPercentage: '5',
    enhancementAmount: '10',
    maxEnhancements: '3',
    stopLoss: '10',
    reinvestProfits: false,
    manualMode: true
  });

  const [isRunning, setIsRunning] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [completedTrades, setCompletedTrades] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const toggleBot = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BotIcon className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Trading Bot</h2>
              <p className="text-gray-400">Automated Trading System</p>
            </div>
          </div>
          <button
            onClick={toggleBot}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
              isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Power className="w-5 h-5" />
            <span>{isRunning ? 'Stop Bot' : 'Start Bot'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Account Balance</p>
                <p className="text-xl font-bold">${balance} USDT</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">Completed Trades</p>
                <p className="text-xl font-bold">{completedTrades}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-400">Mode</p>
                <p className="text-xl font-bold">{settings.manualMode ? 'Manual' : 'Automatic'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exchange Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Exchange Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Exchange</label>
                <select
                  name="exchange"
                  value={settings.exchange}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                >
                  <option value="binance">Binance</option>
                  <option value="kucoin">KuCoin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                <input
                  type="password"
                  name="apiKey"
                  value={settings.apiKey}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">API Secret</label>
                <input
                  type="password"
                  name="apiSecret"
                  value={settings.apiSecret}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Trading Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Trading Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Trading Pair</label>
                <input
                  type="text"
                  name="symbol"
                  placeholder="e.g., BTC/USDT"
                  value={settings.symbol}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Trade Amount (USDT)</label>
                <input
                  type="number"
                  name="tradeAmount"
                  value={settings.tradeAmount}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Profit Margin (%)</label>
                <input
                  type="number"
                  name="profitMargin"
                  value={settings.profitMargin}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Exchange Fee (%)</label>
                <input
                  type="number"
                  name="exchangeFee"
                  value={settings.exchangeFee}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Enhancement Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Enhancement Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Enhancement Drop (%)</label>
                <input
                  type="number"
                  name="enhancementPercentage"
                  value={settings.enhancementPercentage}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Enhancement Amount (USDT)</label>
                <input
                  type="number"
                  name="enhancementAmount"
                  value={settings.enhancementAmount}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Max Enhancements</label>
                <input
                  type="number"
                  name="maxEnhancements"
                  value={settings.maxEnhancements}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  name="stopLoss"
                  value={settings.stopLoss}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Additional Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="reinvestProfits"
                  checked={settings.reinvestProfits}
                  onChange={handleInputChange}
                  className="w-4 h-4 bg-gray-700 rounded"
                />
                <span>Reinvest Profits</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="manualMode"
                  checked={settings.manualMode}
                  onChange={handleInputChange}
                  className="w-4 h-4 bg-gray-700 rounded"
                />
                <span>Manual Mode</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}