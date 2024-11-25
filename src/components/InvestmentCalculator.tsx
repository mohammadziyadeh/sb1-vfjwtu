import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Clock, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Trade {
  id: number;
  amount: number;
  completed: boolean;
  profit: number;
  totalAmount: number;
}

interface InputFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  type?: string;
  step?: string;
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  prefix,
  suffix,
  type = 'text',
  step,
}: InputFieldProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">
        {label}
      </label>
      <div className="relative">
        <div
          className={`absolute ${
            isRTL ? 'right-3' : 'left-3'
          } top-1/2 transform -translate-y-1/2 text-gray-400`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          className={`w-full ${
            isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'
          } py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
        />
        {(prefix || suffix) && (
          <div
            className={`absolute ${
              isRTL ? 'left-3' : 'right-3'
            } top-1/2 transform -translate-y-1/2 text-gray-400`}
          >
            {prefix || suffix}
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  prefix?: string;
}

function ResultCard({ title, value, icon: Icon, prefix }: ResultCardProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {prefix}
            {value}
          </p>
        </div>
        <div className="bg-gray-600 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    </div>
  );
}

export default function InvestmentCalculator() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [investment, setInvestment] = useState(() => {
    return localStorage.getItem('calculator_investment') || '1000';
  });

  const [profitMargin, setProfitMargin] = useState(() => {
    return localStorage.getItem('calculator_profitMargin') || '2.5';
  });

  const [trades, setTrades] = useState(() => {
    return localStorage.getItem('calculator_trades') || '10';
  });

  const [tradesList, setTradesList] = useState<Trade[]>(() => {
    const savedTrades = localStorage.getItem('calculator_trades_list');
    const savedCompletionStates = localStorage.getItem(
      'calculator_completion_states'
    );

    if (savedTrades && savedCompletionStates) {
      const trades = JSON.parse(savedTrades);
      const completionStates = JSON.parse(savedCompletionStates);

      return trades.map((trade: Trade) => ({
        ...trade,
        completed: completionStates[trade.id] || false,
      }));
    }

    return [];
  });

  const [results, setResults] = useState({
    totalProfit: 0,
    finalAmount: 0,
    profitPerTrade: 0,
  });

  useEffect(() => {
    const completionStates = tradesList.reduce((acc, trade) => {
      acc[trade.id] = trade.completed;
      return acc;
    }, {} as Record<number, boolean>);

    localStorage.setItem(
      'calculator_completion_states',
      JSON.stringify(completionStates)
    );
    localStorage.setItem('calculator_investment', investment);
    localStorage.setItem('calculator_profitMargin', profitMargin);
    localStorage.setItem('calculator_trades', trades);
    localStorage.setItem('calculator_trades_list', JSON.stringify(tradesList));
  }, [investment, profitMargin, trades, tradesList]);

  useEffect(() => {
    const initialInvestment = parseFloat(investment) || 0;
    const margin = parseFloat(profitMargin) || 0;
    const numTrades = parseInt(trades) || 0;

    let currentAmount = initialInvestment;
    let totalProfit = 0;

    const savedCompletionStates = JSON.parse(
      localStorage.getItem('calculator_completion_states') || '{}'
    );

    const newTrades = Array.from({ length: numTrades }, (_, index) => {
      const profitForThisTrade = currentAmount * (margin / 100);
      const tradeData = {
        id: index + 1,
        amount: currentAmount,
        completed: savedCompletionStates[index + 1] || false,
        profit: profitForThisTrade,
        totalAmount: currentAmount + profitForThisTrade,
      };

      totalProfit += profitForThisTrade;
      currentAmount += profitForThisTrade;
      return tradeData;
    });

    setTradesList(newTrades);
    setResults({
      totalProfit,
      finalAmount: initialInvestment + totalProfit,
      profitPerTrade: totalProfit / numTrades,
    });
  }, [investment, profitMargin, trades]);

  const toggleTradeComplete = (id: number) => {
    setTradesList((prev) => {
      const newList = prev.map((trade) =>
        trade.id === id ? { ...trade, completed: !trade.completed } : trade
      );

      const completionStates = newList.reduce((acc, trade) => {
        acc[trade.id] = trade.completed;
        return acc;
      }, {} as Record<number, boolean>);

      localStorage.setItem(
        'calculator_completion_states',
        JSON.stringify(completionStates)
      );

      return newList;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Calculator className="mr-2 text-blue-500" />
          {t('calculator.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField
            icon={DollarSign}
            label={t('calculator.initialInvestment')}
            value={investment}
            onChange={setInvestment}
            prefix="$"
            type="number"
          />
          <InputField
            icon={TrendingUp}
            label={t('calculator.profitMargin')}
            value={profitMargin}
            onChange={setProfitMargin}
            suffix="%"
            type="number"
            step="0.1"
          />
          <InputField
            icon={Clock}
            label={t('calculator.numberOfTrades')}
            value={trades}
            onChange={setTrades}
            type="number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultCard
          title={t('calculator.averageProfitPerTrade')}
          value={results.profitPerTrade.toFixed(2)}
          icon={TrendingUp}
          prefix="$"
        />
        <ResultCard
          title={t('calculator.totalProfit')}
          value={results.totalProfit.toFixed(2)}
          icon={DollarSign}
          prefix="$"
        />
        <ResultCard
          title={t('calculator.finalAmount')}
          value={results.finalAmount.toFixed(2)}
          icon={Calculator}
          prefix="$"
        />
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4">
          {t('calculator.compoundProgress')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="py-3 px-4">{t('calculator.tradeNumber')}</th>
                <th className="py-3 px-4">
                  {t('calculator.investmentAmount')}
                </th>
                <th className="py-3 px-4">{t('calculator.expectedProfit')}</th>
                <th className="py-3 px-4">{t('calculator.totalAfterTrade')}</th>
                <th className="py-3 px-4">{t('calculator.status')}</th>
                <th className="py-3 px-4">{t('calculator.action')}</th>
              </tr>
            </thead>
            <tbody>
              {tradesList.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-700">
                  <td className="py-4 px-4">
                    {t('calculator.tradeNumber')} {trade.id}
                  </td>
                  <td className="py-4 px-4">${trade.amount.toFixed(2)}</td>
                  <td className="py-4 px-4">${trade.profit.toFixed(2)}</td>
                  <td className="py-4 px-4">${trade.totalAmount.toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        trade.completed
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {trade.completed
                        ? t('calculator.completed')
                        : t('calculator.pending')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleTradeComplete(trade.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        trade.completed
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
