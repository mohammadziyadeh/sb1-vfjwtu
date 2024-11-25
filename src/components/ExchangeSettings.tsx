import React, { useState } from 'react';
import { Wallet, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useExchange } from '../context/ExchangeContext';
import { SUPPORTED_EXCHANGES } from '../services/exchangeService';

interface ExchangeConfig {
  exchange: string;
  apiKey: string;
  apiSecret: string;
}

export default function ExchangeSettings() {
  const { configs, balances, validationStatus, addExchange, removeExchange } = useExchange();
  const [newConfig, setNewConfig] = useState<ExchangeConfig>({
    exchange: SUPPORTED_EXCHANGES[0].id,
    apiKey: '',
    apiSecret: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const { t } = useLanguage();

  const handleAddExchange = async () => {
    if (!newConfig.apiKey || !newConfig.apiSecret) return;
    
    setIsValidating(true);
    try {
      const success = await addExchange(newConfig);
      if (success) {
        setNewConfig({
          exchange: SUPPORTED_EXCHANGES[0].id,
          apiKey: '',
          apiSecret: ''
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Wallet className="w-5 h-5 mr-2" />
        {t('settings.exchanges.title')}
      </h3>

      <div className="space-y-6">
        {/* Add New Exchange */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.exchanges.select')}
              </label>
              <select
                value={newConfig.exchange}
                onChange={(e) => setNewConfig(prev => ({ ...prev, exchange: e.target.value }))}
                className="w-full bg-gray-600 rounded-lg p-2"
              >
                {SUPPORTED_EXCHANGES.map(exchange => (
                  <option key={exchange.id} value={exchange.id}>
                    {exchange.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.exchanges.apiKey')}
              </label>
              <input
                type="password"
                value={newConfig.apiKey}
                onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full bg-gray-600 rounded-lg p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.exchanges.apiSecret')}
              </label>
              <input
                type="password"
                value={newConfig.apiSecret}
                onChange={(e) => setNewConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                className="w-full bg-gray-600 rounded-lg p-2"
              />
            </div>
          </div>
          
          <button
            onClick={handleAddExchange}
            disabled={isValidating || !newConfig.apiKey || !newConfig.apiSecret}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {isValidating ? t('common.loading') : t('settings.exchanges.add')}
          </button>
        </div>

        {/* Connected Exchanges */}
        {configs.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">
              {t('settings.exchanges.connected')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map((config) => (
                <div
                  key={config.exchange}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">
                        {SUPPORTED_EXCHANGES.find(e => e.id === config.exchange)?.name}
                      </span>
                      {validationStatus[config.exchange] ? (
                        <Check className="w-4 h-4 text-green-500 ml-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                      )}
                    </div>
                    {validationStatus[config.exchange] && balances[config.exchange] !== undefined && (
                      <p className="text-sm text-gray-400 mt-1">
                        {balances[config.exchange]?.toFixed(2)} USDT
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeExchange(config.exchange)}
                    className="text-red-500 hover:text-red-400"
                  >
                    {t('common.remove')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}